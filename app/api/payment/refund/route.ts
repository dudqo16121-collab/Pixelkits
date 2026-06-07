import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/payment/refund
// body: { orderId: string; reason?: string }
// Authorization: Bearer <admin-token>

async function checkAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin ? user : null
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. 관리자 인증 ────────────────────────────────────
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
    }

    const { orderId, reason = '고객 요청 환불' } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId가 없어요' }, { status: 400 })
    }

    // ── 2. 주문 조회 ──────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, amount, payment_key, toss_order_id, user_email, order_number')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: '주문을 찾을 수 없어요' }, { status: 404 })
    }
    if (order.status === 'refunded') {
      return NextResponse.json({ error: '이미 환불된 주문이에요' }, { status: 400 })
    }
    if (order.status !== 'completed') {
      return NextResponse.json({ error: '완료된 주문만 환불할 수 있어요' }, { status: 400 })
    }
    if (!order.payment_key) {
      return NextResponse.json({ error: 'payment_key가 없어요. Toss 대시보드에서 직접 환불해주세요.' }, { status: 400 })
    }

    // ── 3. Toss 취소 API 호출 ────────────────────────────
    const tossSecretKey = process.env.TOSS_SECRET_KEY!
    const basicToken    = Buffer.from(`${tossSecretKey}:`).toString('base64')

    const tossRes = await fetch(
      `https://api.tosspayments.com/v1/payments/${order.payment_key}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Basic ${basicToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: reason,
          cancelAmount: order.amount,   // 전액 환불 (부분 환불 필요 시 수정)
        }),
      }
    )

    const tossData = await tossRes.json()

    if (!tossRes.ok) {
      console.error('[Toss] 환불 실패:', tossData)
      return NextResponse.json(
        { error: tossData.message ?? 'Toss 환불 요청에 실패했어요' },
        { status: 400 }
      )
    }

    // ── 4. DB 상태 업데이트 ───────────────────────────────
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status:       'refunded',
        refund_reason: reason,
        refunded_at:  new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateErr) {
      // Toss는 환불됐는데 DB 업데이트 실패 — 심각한 오류, 로그 남기기
      console.error('[CRITICAL] Toss 환불 완료됐으나 DB 업데이트 실패:', updateErr)
      return NextResponse.json(
        { error: 'Toss 환불은 완료됐으나 DB 업데이트에 실패했어요. 관리자에게 문의하세요.' },
        { status: 500 }
      )
    }

    console.log(`[환불 완료] 주문 ${order.order_number} / ${order.user_email} / ₩${order.amount.toLocaleString()}`)

    return NextResponse.json({
      success:       true,
      orderNumber:   order.order_number,
      refundAmount:  order.amount,
      tossResponse:  tossData.status,
    })

  } catch (err) {
    console.error('[API] /payment/refund 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}