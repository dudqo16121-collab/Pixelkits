import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

// POST /api/webhook
// Toss Payments 웹훅 수신
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // ── 1. HMAC 서명 검증 ────────────────────────────────
    const tossSignature = req.headers.get('toss-signature')
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET

    if (webhookSecret && tossSignature) {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('base64')

      if (tossSignature !== expectedSig) {
        console.error('[Webhook] 서명 불일치')
        return NextResponse.json({ error: '유효하지 않은 서명' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const { eventType, data } = payload

    console.log(`[Webhook] 이벤트: ${eventType}`, data?.paymentKey ?? '')

    // ── 2. 이벤트 타입별 처리 ─────────────────────────────
    switch (eventType) {

      // 결제 완료
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, orderId, status, totalAmount } = data

        if (status === 'DONE') {
          // orders 테이블에서 toss_order_id로 찾아 completed 처리
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('toss_order_id', orderId)
            .single()

          if (order && order.status !== 'completed') {
            await supabaseAdmin
              .from('orders')
              .update({
                status:     'completed',
                payment_key: paymentKey,
                updated_at: new Date().toISOString(),
              })
              .eq('toss_order_id', orderId)

            console.log(`[Webhook] 결제 완료 처리: ${orderId}`)
          }
        }

        if (status === 'CANCELED') {
          await supabaseAdmin
            .from('orders')
            .update({
              status:     'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('toss_order_id', orderId)

          console.log(`[Webhook] 결제 취소 처리: ${orderId}`)
        }

        if (status === 'ABORTED') {
          await supabaseAdmin
            .from('orders')
            .update({
              status:     'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('toss_order_id', orderId)

          console.log(`[Webhook] 결제 실패 처리: ${orderId}`)
        }
        break
      }

      // 결제 취소 완료
      case 'PAYMENT_CANCELED': {
        const { paymentKey, orderId } = data

        await supabaseAdmin
          .from('orders')
          .update({
            status:     'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('toss_order_id', orderId)

        // 프로모 코드 사용 횟수 롤백
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('promo_code')
          .eq('toss_order_id', orderId)
          .single()

        if (order?.promo_code) {
          const { data: promo } = await supabaseAdmin
            .from('promo_codes')
            .select('used_count')
            .eq('code', order.promo_code)
            .single()

          if (promo && promo.used_count > 0) {
            await supabaseAdmin
              .from('promo_codes')
              .update({ used_count: promo.used_count - 1 })
              .eq('code', order.promo_code)
          }
        }

        console.log(`[Webhook] 취소 완료 처리: ${orderId}`)
        break
      }

      // 정기결제 (현재 미사용, 확장용)
      case 'BILLING_KEY_ISSUED':
      case 'BILLING_KEY_DELETED':
        console.log(`[Webhook] 정기결제 이벤트 (미처리): ${eventType}`)
        break

      default:
        console.log(`[Webhook] 알 수 없는 이벤트: ${eventType}`)
    }

    // ── 3. Toss에 200 응답 (필수) ────────────────────────
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook] 처리 오류:', err)
    // 웹훅은 항상 200 반환해야 재시도 루프 방지
    return NextResponse.json({ received: true })
  }
}