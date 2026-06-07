import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

// POST /api/payment/refund
// body: { orderId: string; reason?: string; refundAmount?: number }
export async function POST(req: NextRequest) {
  try {
    // ── 1. 관리자 인증 ────────────────────────────────────
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
    }

    const {
      orderId,
      reason       = '고객 요청 환불',
      refundAmount,          // 없으면 전액 환불
    } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId가 없어요' }, { status: 400 })
    }

    // ── 2. 주문 조회 ──────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, amount, refunded_amount, payment_key, toss_order_id, user_email, order_number')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: '주문을 찾을 수 없어요' }, { status: 404 })
    }
    if (order.status === 'refunded') {
      return NextResponse.json({ error: '이미 전액 환불된 주문이에요' }, { status: 400 })
    }
    if (order.status !== 'completed' && order.status !== 'partial_refund') {
      return NextResponse.json({ error: '완료된 주문만 환불할 수 있어요' }, { status: 400 })
    }
    if (!order.payment_key) {
      return NextResponse.json({ error: 'payment_key가 없어요. Toss 대시보드에서 직접 환불해주세요.' }, { status: 400 })
    }

    // ── 3. 환불 금액 계산 ─────────────────────────────────
    const alreadyRefunded = order.refunded_amount ?? 0
    const maxRefundable   = order.amount - alreadyRefunded
    const cancelAmount    = refundAmount
      ? Math.min(Number(refundAmount), maxRefundable)  // 부분 환불
      : maxRefundable                                   // 전액 환불

    if (cancelAmount <= 0) {
      return NextResponse.json({ error: '환불 가능한 금액이 없어요' }, { status: 400 })
    }

    // ── 4. Toss 취소 API 호출 ─────────────────────────────
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
          cancelAmount,   // 부분 금액 or 전액
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

    // ── 5. DB 업데이트 ────────────────────────────────────
    const newRefundedAmount = alreadyRefunded + cancelAmount
    const isFullRefund      = newRefundedAmount >= order.amount

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status:          isFullRefund ? 'refunded' : 'partial_refund',
        refunded_amount: newRefundedAmount,
        refund_reason:   reason,
        refunded_at:     new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateErr) {
      console.error('[CRITICAL] Toss 환불 완료됐으나 DB 업데이트 실패:', updateErr)
      return NextResponse.json(
        { error: 'Toss 환불은 완료됐으나 DB 업데이트에 실패했어요. 관리자에게 문의하세요.' },
        { status: 500 }
      )
    }

    console.log(
      `[환불] 주문 ${order.order_number} / ${order.user_email}` +
      ` / 이번 환불 ₩${cancelAmount.toLocaleString()}` +
      ` / 누적 환불 ₩${newRefundedAmount.toLocaleString()}` +
      ` / ${isFullRefund ? '전액환불' : '부분환불'}`
    )

    return NextResponse.json({
      success:          true,
      orderNumber:      order.order_number,
      cancelAmount,
      totalRefunded:    newRefundedAmount,
      remainingAmount:  order.amount - newRefundedAmount,
      isFullRefund,
    })

  } catch (err) {
    console.error('[API] /payment/refund 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}