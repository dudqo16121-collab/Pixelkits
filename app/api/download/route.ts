import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/download?token=xxx&type=source|guide|license|all
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const type  = req.nextUrl.searchParams.get('type') ?? 'source'

  if (!token) {
    return NextResponse.json({ error: '토큰이 없어요' }, { status: 400 })
  }

  // 1. 토큰으로 주문 조회
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, token_expires_at, template_id, templates(slug, download_path, name)')
    .eq('download_token', token)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: '유효하지 않은 토큰이에요' }, { status: 404 })
  }

  // 2. 주문 상태 확인
  if (order.status !== 'completed') {
    return NextResponse.json({ error: '완료된 주문이 아니에요' }, { status: 403 })
  }

  // 3. 토큰 만료 확인
  if (new Date(order.token_expires_at) < new Date()) {
    return NextResponse.json({ error: '다운로드 링크가 만료됐어요. 구매 내역에서 재발급하세요.' }, { status: 410 })
  }

  const template = (order as any).templates
  if (!template?.download_path) {
    return NextResponse.json({ error: '파일 경로가 등록되지 않았어요' }, { status: 404 })
  }

  // 4. type별 Storage 경로 결정
  const basePath = template.download_path.replace(/\.zip$/, '') // e.g. "templates/lumina-saas-kit-v1"
  const pathMap: Record<string, string> = {
    source:  `${basePath}.zip`,
    guide:   `${basePath}-guide.pdf`,
    license: `${basePath}-license.txt`,
  }

  if (type === 'all') {
    // 전체 다운로드 → source zip만 반환 (실제 서비스에선 서버에서 묶어도 됨)
    const { data, error: dlErr } = await supabaseAdmin.storage
      .from('templates')
      .createSignedUrl(pathMap['source'], 60 * 5) // 5분 유효

    if (dlErr || !data) {
      return NextResponse.json({ error: '파일을 찾을 수 없어요' }, { status: 404 })
    }
    return NextResponse.redirect(data.signedUrl)
  }

  const filePath = pathMap[type]
  if (!filePath) {
    return NextResponse.json({ error: '잘못된 파일 타입이에요' }, { status: 400 })
  }

  // 5. Signed URL 생성 (5분 유효)
  const { data, error: dlErr } = await supabaseAdmin.storage
    .from('templates')
    .createSignedUrl(filePath, 60 * 5)

  if (dlErr || !data) {
    return NextResponse.json({ error: '파일을 찾을 수 없어요' }, { status: 404 })
  }

  // 6. Signed URL로 리다이렉트
  return NextResponse.redirect(data.signedUrl)
}