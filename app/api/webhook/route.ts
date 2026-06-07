import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPurchaseEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // ── 1. 웹훅 서명 검증 ─────────────────────────────────
    const rawBody  = await req.text()
    const secret   = process.env.TOSS_WEBHOOK_SECRET ?? ''

    if (secret) {
      const signature = req.headers.get('toss-signature') ?? ''
      const expected  = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

      if (signature !== expected) {
        console.warn('[Webhook] 서명 불일치')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { eventType, data } = JSON.parse(rawBody)

    // ── 2. 이벤트 타입별 처리 ─────────────────────────────
    switch (eventType) {

      // 결제 완료
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, orderId, status } = data

        if (status === 'DONE') {
          // 주문 조회
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, status, user_email, order_number, amount, download_token, token_expires_at, templates(name)')
            .eq('toss_order_id', orderId)
            .single()

          if (order && order.status !== 'completed') {
            await supabaseAdmin
              .from('orders')
              .update({
                status:      'completed',
                payment_key: paymentKey,
                updated_at:  new Date().toISOString(),
              })
              .eq('toss_order_id', orderId)

            // 이메일 발송 (웹훅 경유 완료 처리 시)
            if (order.user_email) {
              const templateName = (order as any).templates?.name ?? '구매 템플릿'
              sendPurchaseEmail({
                to:             order.user_email,
                orderNumber:    order.order_number,
                templateName,
                amount:         order.amount,
                downloadToken:  order.download_token,
                tokenExpiresAt: order.token_expires_at,
              }).catch((err) => console.error('[Webhook Email] 발송 오류:', err))
            }

            console.log(`[Webhook] 결제 완료 처리: ${orderId}`)
          }
        }

        if (status === 'CANCELED') {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('toss_order_id', orderId)
          console.log(`[Webhook] 결제 취소 처리: ${orderId}`)
        }

        if (status === 'ABORTED') {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('toss_order_id', orderId)
          console.log(`[Webhook] 결제 실패 처리: ${orderId}`)
        }
        break
      }

      // 결제 취소 완료
      case 'PAYMENT_CANCELED': {
        const { orderId } = data

        await supabaseAdmin
          .from('orders')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
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

      case 'BILLING_KEY_ISSUED':
      case 'BILLING_KEY_DELETED':
        console.log(`[Webhook] 정기결제 이벤트 (미처리): ${eventType}`)
        break

      default:
        console.log(`[Webhook] 알 수 없는 이벤트: ${eventType}`)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook] 처리 오류:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}