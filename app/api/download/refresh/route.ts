import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/download/refresh
// body: { orderId: string }
export async function POST(req: NextRequest) {
  // 1. 로그인 확인
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

  // 2. 본인 주문인지 확인
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없어요' }, { status: 403 })
  }
  if (order.status !== 'completed') {
    return NextResponse.json({ error: '완료된 주문이 아니에요' }, { status: 403 })
  }

  // 3. 새 토큰 + 만료시간 재발급
  const newToken   = crypto.randomBytes(32).toString('hex')
  const newExpires = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      download_token:   newToken,
      token_expires_at: newExpires,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: '재발급에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({
    downloadToken:  newToken,
    tokenExpiresAt: newExpires,
  })
}