import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

// 토스페이먼츠 웹훅
// POST /api/webhook
// 토스 대시보드 → 개발 → 웹훅 URL에 등록하세요
// 이벤트: PAYMENT_STATUS_CHANGED

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()

    // ── 웹훅 서명 검증 ────────────────────────────────────
    // 토스페이먼츠는 X-Toss-Signature 헤더로 HMAC-SHA256 서명을 보냄
    const signature  = req.headers.get('X-Toss-Signature')
    const webhookKey = process.env.TOSS_WEBHOOK_SECRET_KEY

    if (webhookKey && signature) {
      const expectedSig = crypto
        .createHmac('sha256', webhookKey)
        .update(body)
        .digest('base64')

      if (expectedSig !== signature) {
        console.warn('[Webhook] 서명 불일치 — 위변조 의심')
        return NextResponse.json({ error: '서명 불일치' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const { eventType, data } = event

    console.log('[Webhook] 이벤트 수신:', eventType, data?.orderId)

    // ── 이벤트 처리 ───────────────────────────────────────
    switch (eventType) {

      // 결제 상태 변경
      case 'PAYMENT_STATUS_CHANGED': {
        const { orderId, status } = data

        // 토스 status → DB status 매핑
        const statusMap: Record<string, string> = {
          DONE:     'completed',
          CANCELED: 'refunded',
          ABORTED:  'failed',
          EXPIRED:  'failed',
        }
        const dbStatus = statusMap[status]
        if (!dbStatus) break

        const { error } = await supabaseAdmin
          .from('orders')
          .update({ status: dbStatus, updated_at: new Date().toISOString() })
          .eq('toss_order_id', orderId)

        if (error) {
          console.error('[Webhook] 주문 상태 업데이트 실패:', error)
          return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 })
        }

        console.log(`[Webhook] 주문 ${orderId} → ${dbStatus}`)
        break
      }

      default:
        console.log('[Webhook] 처리하지 않는 이벤트:', eventType)
    }

    // 토스페이먼츠는 200 응답이 없으면 웹훅을 재전송하므로 반드시 200 반환
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[Webhook] 처리 오류:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
