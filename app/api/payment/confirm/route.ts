import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPurchaseEmail } from '@/lib/email'
import { rateLimit, getIP } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // ── 0. Rate Limiting ──────────────────────────────────
    const ip     = getIP(req)
    const authHeader = req.headers.get('Authorization')
    const rlKey  = authHeader ? `payment:${authHeader.slice(-12)}` : `payment:${ip}`
    const rl     = rateLimit(rlKey, 5, 60_000) // 1분에 5회

    if (!rl.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    const {
      paymentKey,
      orderId,
      amount,
      templateSlug,
      email,
      paymentMethod,
      promoCode,
    } = await req.json()

    // ── 1. 필수값 검증 ────────────────────────────────────
    if (!paymentKey || !orderId || !templateSlug || !email) {
      return NextResponse.json({ error: '필수 파라미터가 누락됐어요' }, { status: 400 })
    }

    const isFree = paymentKey === 'FREE'

    // ── 2. Toss 결제 승인 (유료일 때만) ──────────────────
    if (!isFree) {
      const tossSecretKey = process.env.TOSS_SECRET_KEY!
      const basicToken    = Buffer.from(`${tossSecretKey}:`).toString('base64')

      const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization:  `Basic ${basicToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })

      const tossData = await tossRes.json()
      if (!tossRes.ok) {
        console.error('[Toss] 결제 승인 실패:', tossData)
        return NextResponse.json(
          { error: tossData.message ?? '결제 승인에 실패했어요' },
          { status: 400 }
        )
      }
    }

    // ── 3. 템플릿 조회 ────────────────────────────────────
    const { data: template, error: tmplErr } = await supabaseAdmin
      .from('templates')
      .select('id, name, price, original_price, is_published')
      .eq('slug', templateSlug)
      .single()

    if (tmplErr || !template) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없어요' }, { status: 404 })
    }
    if (!template.is_published) {
      return NextResponse.json({ error: '비공개 템플릿입니다' }, { status: 403 })
    }

    // ── 4. 프로모 코드 검증 & 할인 계산 ──────────────────
    let discountAmount = 0
    if (promoCode) {
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (
        promo &&
        (!promo.expires_at || new Date(promo.expires_at) > new Date()) &&
        (!promo.max_uses    || promo.used_count < promo.max_uses)
      ) {
        discountAmount = Math.round(template.price * (promo.discount_percent / 100))
        await supabaseAdmin
          .from('promo_codes')
          .update({ used_count: promo.used_count + 1 })
          .eq('code', promo.code)
      }
    }

    const expectedAmount = Math.max(0, template.price - discountAmount)

    // ── 5. 금액 무결성 검증 ───────────────────────────────
    if (isFree) {
      if (expectedAmount !== 0) {
        return NextResponse.json({ error: '유료 템플릿은 무료로 받을 수 없어요' }, { status: 400 })
      }
    } else {
      if (amount !== expectedAmount) {
        console.error('[Security] 금액 불일치:', { amount, expectedAmount })
        return NextResponse.json({ error: '결제 금액이 일치하지 않아요' }, { status: 400 })
      }
    }

    // ── 6. 로그인 유저 확인 ───────────────────────────────
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id ?? null
    }

    // ── 6-1. 중복 구매 방지 ───────────────────────────────
    if (userId) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .eq('user_id', userId)
        .eq('template_id', template.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          {
            error:       '이미 구매한 템플릿이에요.',
            code:        'ALREADY_PURCHASED',
            orderNumber: existing.order_number,
          },
          { status: 409 }
        )
      }
    }

    // ── 7. orders 테이블에 저장 ───────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id:         userId,
        user_email:      email,
        template_id:     template.id,
        amount:          expectedAmount,
        original_amount: template.original_price ?? template.price,
        discount_amount: discountAmount,
        promo_code:      promoCode ?? null,
        payment_method:  isFree ? 'free' : paymentMethod,
        payment_key:     isFree ? null   : paymentKey,
        toss_order_id:   orderId,
        status:          'completed',
      })
      .select('id, order_number, download_token, token_expires_at')
      .single()

    if (orderErr) {
      console.error('[DB] 주문 저장 실패:', orderErr)
      return NextResponse.json({ error: '주문 저장에 실패했어요' }, { status: 500 })
    }

    // ── 8. 템플릿 다운로드 카운트 증가 (RPC) ─────────────
    await supabaseAdmin.rpc('increment_template_download_count', {
      template_id: template.id,
    })

    // ── 9. 구매 완료 이메일 발송 ──────────────────────────
    sendPurchaseEmail({
      to:             email,
      orderNumber:    order.order_number,
      templateName:   template.name,
      amount:         expectedAmount,
      downloadToken:  order.download_token,
      tokenExpiresAt: order.token_expires_at,
    }).catch((err) => console.error('[Email] 발송 오류:', err))

    return NextResponse.json({
      success:        true,
      orderNumber:    order.order_number,
      downloadToken:  order.download_token,
      tokenExpiresAt: order.token_expires_at,
    })

  } catch (err) {
    console.error('[API] /payment/confirm 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}