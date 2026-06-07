import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

// POST /api/download/refresh
// body: { orderId: string }
export async function POST(req: NextRequest) {
  // ── 1. 로그인 확인 ────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 세션이에요' }, { status: 401 })
  }

  const { orderId } = await req.json()
  if (!orderId) {
    return NextResponse.json({ error: '주문 ID가 없어요' }, { status: 400 })
  }

  // ── 2. 본인 주문인지 확인 ────────────────────────────────
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, token_expires_at, download_count, max_download_count')
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없어요' }, { status: 403 })
  }
  if (order.status !== 'completed') {
    return NextResponse.json({ error: '완료된 주문이 아니에요' }, { status: 403 })
  }

  // ── 3. 재발급 가능 여부 확인 ─────────────────────────────
  // 토큰이 아직 유효한데 횟수도 남아있으면 재발급 불필요
  const isExpired   = new Date(order.token_expires_at) < new Date()
  const isExhausted = (order.download_count ?? 0) >= (order.max_download_count ?? 5)

  if (!isExpired && !isExhausted) {
    return NextResponse.json(
      { error: '아직 다운로드가 가능해요. 링크가 만료되거나 횟수를 다 쓴 경우에만 재발급할 수 있어요.' },
      { status: 400 }
    )
  }

  // ── 4. 새 토큰 + 만료시간 발급, 횟수 리셋 ──────────────
  const newToken   = crypto.randomBytes(32).toString('hex')
  const newExpires = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72시간

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      download_token:    newToken,
      token_expires_at:  newExpires,
      download_count:    0,          // 횟수 리셋
      updated_at:        new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: '재발급에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({
    downloadToken:  newToken,
    tokenExpiresAt: newExpires,
    remainingCount: order.max_download_count ?? 5, // 리셋 후 남은 횟수
  })
}