import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function checkAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return false
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return data?.is_admin ?? false
}

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
  }

  // auth.users 전체 조회 (서비스 롤 키로만 가능)
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // profiles 조회 (is_admin, name)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, name, is_admin')

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  // orders 집계
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('user_id, amount')
    .eq('status', 'completed')

  const aggMap: Record<string, { count: number; total: number }> = {}
  for (const o of orders ?? []) {
    if (!o.user_id) continue
    if (!aggMap[o.user_id]) aggMap[o.user_id] = { count: 0, total: 0 }
    aggMap[o.user_id].count += 1
    aggMap[o.user_id].total += o.amount
  }

  const result = users.map((u) => ({
    id:          u.id,
    email:       u.email ?? '',
    name:        profileMap[u.id]?.name ?? null,
    is_admin:    profileMap[u.id]?.is_admin ?? false,
    created_at:  u.created_at,
    order_count: aggMap[u.id]?.count ?? 0,
    total_spent: aggMap[u.id]?.total ?? 0,
  }))

  return NextResponse.json({ users: result })
}