import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNewsletter } from '@/lib/email'

async function checkAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return false
  const { data } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ?? false
}

// POST /api/newsletter
// body: { subject, title, body, ctaText?, ctaUrl?, audience: 'all'|'newsletter'|'purchasers' }
export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })

  const { subject, title, body, ctaText, ctaUrl, audience } = await req.json()

  if (!subject || !title || !body) {
    return NextResponse.json({ error: '제목, 타이틀, 본문은 필수예요' }, { status: 400 })
  }

  // ── 수신자 조회 ───────────────────────────────────────
  let recipients: string[] = []

  if (audience === 'all' || audience === 'newsletter') {
    // 뉴스레터 수신 동의 유저
    const { data: notifUsers } = await supabaseAdmin
      .from('notification_settings')
      .select('user_id')
      .eq('newsletter', true)

    if (notifUsers && notifUsers.length > 0) {
      const userIds = notifUsers.map((u) => u.user_id)
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const emailMap = Object.fromEntries(users.map((u) => [u.id, u.email ?? '']))
      recipients = userIds.map((id) => emailMap[id]).filter(Boolean)
    }
  }

  if (audience === 'purchasers') {
    // 구매자 전체
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('user_email')
      .eq('status', 'completed')

    recipients = [...new Set((orders ?? []).map((o) => o.user_email).filter(Boolean))]
  }

  if (audience === 'all') {
    // 구매자도 포함 (중복 제거)
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('user_email')
      .eq('status', 'completed')

    const purchaserEmails = (orders ?? []).map((o) => o.user_email).filter(Boolean)
    recipients = [...new Set([...recipients, ...purchaserEmails])]
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: '수신자가 없어요' }, { status: 400 })
  }

  const result = await sendNewsletter({ subject, title, body, ctaText, ctaUrl, recipients })

  return NextResponse.json({
    success:    result.success,
    sent:       result.sent,
    failed:     result.failed,
    total:      recipients.length,
  })
}