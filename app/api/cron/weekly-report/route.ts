import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWeeklyReport } from '@/lib/email'

// Vercel Cron — 매주 월요일 오전 9시 (KST = UTC+9 → UTC 00:00)
export async function GET(req: NextRequest) {
  // Cron 시크릿 검증
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now       = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // ── 이번 주 주문 ──────────────────────────────────────
  const { data: weekOrders } = await supabaseAdmin
    .from('orders')
    .select('amount, template_id, templates(name)')
    .eq('status', 'completed')
    .gte('created_at', weekStart.toISOString())

  const weekRevenue = (weekOrders ?? []).reduce((s, o) => s + o.amount, 0)
  const weekCount   = weekOrders?.length ?? 0

  // ── 이번 달 주문 ──────────────────────────────────────
  const { data: monthOrders } = await supabaseAdmin
    .from('orders')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())

  const monthRevenue = (monthOrders ?? []).reduce((s, o) => s + o.amount, 0)
  const monthCount   = monthOrders?.length ?? 0

  // ── 인기 템플릿 집계 ──────────────────────────────────
  const templateMap: Record<string, { name: string; count: number }> = {}
  ;(weekOrders ?? []).forEach((o: any) => {
    const id   = o.template_id
    const name = o.templates?.name ?? id
    if (!templateMap[id]) templateMap[id] = { name, count: 0 }
    templateMap[id].count += 1
  })

  const topTemplates = Object.values(templateMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── 주 레이블 ─────────────────────────────────────────
  const weekLabel = (() => {
    const y = weekStart.getFullYear()
    const m = weekStart.getMonth() + 1
    const firstDay = new Date(y, weekStart.getMonth(), 1)
    const weekNum  = Math.ceil((weekStart.getDate() + firstDay.getDay()) / 7)
    return `${y}년 ${m}월 ${weekNum}주`
  })()

  // ── 어드민 이메일 조회 후 발송 ────────────────────────
  const { data: adminProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('is_admin', true)

  if (!adminProfiles || adminProfiles.length === 0) {
    return NextResponse.json({ message: '어드민 없음' })
  }

  const adminIds = adminProfiles.map((p) => p.id)
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const adminEmails = users
    .filter((u) => adminIds.includes(u.id) && u.email)
    .map((u) => u.email!)

  let sent = 0
  for (const email of adminEmails) {
    const result = await sendWeeklyReport({
      to: email,
      weekLabel,
      weekRevenue,
      weekOrders:   weekCount,
      monthRevenue,
      monthOrders:  monthCount,
      topTemplates,
    })
    if (result.success) sent++
  }

  console.log(`[WeeklyReport] ${weekLabel} 리포트 발송: ${sent}/${adminEmails.length}명`)

  return NextResponse.json({
    success:     true,
    weekLabel,
    weekRevenue,
    weekOrders:  weekCount,
    monthRevenue,
    sent,
  })
}