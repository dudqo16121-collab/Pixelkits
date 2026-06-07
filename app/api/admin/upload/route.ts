import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// 관리자 확인 헬퍼
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

// POST /api/admin/upload
// FormData: { file: File, bucket: 'thumbnails'|'templates', path: string }
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
  }

  const formData = await req.formData()
  const file   = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const path   = formData.get('path') as string | null

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: '필수 값이 없어요 (file, bucket, path)' }, { status: 400 })
  }

  // 허용된 버킷만
  if (!['thumbnails', 'templates'].includes(bucket)) {
    return NextResponse.json({ error: '허용되지 않은 버킷이에요' }, { status: 400 })
  }

  // 파일 크기 제한
  const MAX = bucket === 'thumbnails' ? 5 * 1024 * 1024 : 200 * 1024 * 1024
  if (file.size > MAX) {
    return NextResponse.json({ error: '파일 크기 초과' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert:      true,
    })

  if (error) {
    console.error('[Upload] 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // thumbnails는 public URL 반환
  if (bucket === 'thumbnails') {
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('thumbnails')
      .getPublicUrl(path)
    return NextResponse.json({ publicUrl })
  }

  return NextResponse.json({ path })
}