import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 토스페이먼츠 결제 승인 + orders 저장
// POST /api/payment/confirm
// body: { paymentKey, orderId, amount, templateSlug, email, paymentMethod, promoCode? }

export async function POST(req: NextRequest) {
  try {
    const {
      paymentKey,
      orderId,      // 토스페이먼츠 orderId (uuid 형태로 생성해서 넘기세요)
      amount,
      templateSlug,
      email,
      paymentMethod,
      promoCode,
    } = await req.json()

    // ── 1. 필수값 검증 ────────────────────────────────────
    if (!paymentKey || !orderId || !amount || !templateSlug || !email) {
      return NextResponse.json({ error: '필수 파라미터가 누락됐어요' }, { status: 400 })
    }

    // ── 2. 토스페이먼츠 결제 승인 API 호출 ───────────────
    const tossSecretKey = process.env.TOSS_SECRET_KEY!
    const basicToken = Buffer.from(`${tossSecretKey}:`).toString('base64')

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
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

    // ── 3. 템플릿 조회 ────────────────────────────────────
    const { data: template, error: tmplErr } = await supabaseAdmin
      .from('templates')
      .select('id, price, original_price, is_published')
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
        (!promo.max_uses || promo.used_count < promo.max_uses)
      ) {
        discountAmount = Math.round(template.price * (promo.discount_percent / 100))

        // 사용 횟수 증가
        await supabaseAdmin
          .from('promo_codes')
          .update({ used_count: promo.used_count + 1 })
          .eq('code', promo.code)
      }
    }

    const expectedAmount = Math.max(0, template.price - discountAmount)

    // ── 5. 금액 무결성 검증 ───────────────────────────────
    if (amount !== expectedAmount) {
      console.error('[Security] 금액 불일치:', { amount, expectedAmount })
      return NextResponse.json({ error: '결제 금액이 일치하지 않아요' }, { status: 400 })
    }

    // ── 6. 로그인 유저 확인 (선택적) ─────────────────────
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id ?? null
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
        payment_method:  paymentMethod,
        payment_key:     paymentKey,
        toss_order_id:   orderId,
        status:          'completed',
      })
      .select('id, order_number, download_token, token_expires_at')
      .single()

    if (orderErr) {
      console.error('[DB] 주문 저장 실패:', orderErr)
      return NextResponse.json({ error: '주문 저장에 실패했어요' }, { status: 500 })
    }

    // ── 8. 다운로드 횟수 증가 ─────────────────────────────
    await supabaseAdmin
      .from('templates')
      .update({ download_count: template.download_count })  // DB trigger로 처리 가능
      .eq('id', template.id)

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
