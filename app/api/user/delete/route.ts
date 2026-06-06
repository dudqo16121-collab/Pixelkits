import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/user/delete
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 세션이에요' }, { status: 401 })
  }

  // auth.users에서 삭제하면 profiles도 cascade 삭제됨 (DB 설정대로)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: '계정 삭제에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}