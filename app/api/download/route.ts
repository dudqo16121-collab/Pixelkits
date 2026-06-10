import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, getIP } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  // ── 0. Rate Limiting ──────────────────────────────────
  const ip = getIP(req)
  const rl = await rateLimit(`download:${ip}`, 20, 60_000)

  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const type    = req.nextUrl.searchParams.get('type') ?? 'source'
  const orderId = req.nextUrl.searchParams.get('orderId')
  const token   = req.nextUrl.searchParams.get('token')

  let order: any = null

  // ── A. orderId 방식 (로그인 세션) ────────────────────────
  if (orderId) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }
    const sessionToken = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 세션이에요' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id, user_id, status, token_expires_at,
        download_count, max_download_count,
        templates ( slug, download_url, name )
      `)
      .eq('id', orderId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '주문을 찾을 수 없어요' }, { status: 404 })
    }
    if (data.user_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없어요' }, { status: 403 })
    }
    order = data
  }

  // ── B. token 방식 (이메일 링크 호환) ─────────────────────
  else if (token) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id, user_id, status, token_expires_at,
        download_count, max_download_count,
        templates ( slug, download_url, name )
      `)
      .eq('download_token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '유효하지 않은 토큰이에요' }, { status: 404 })
    }
    order = data
  }

  else {
    return NextResponse.json({ error: 'orderId 또는 token이 필요해요' }, { status: 400 })
  }

  // ── 공통 검증 ─────────────────────────────────────────────
  if (order.status !== 'completed') {
    return NextResponse.json({ error: '완료된 주문이 아니에요' }, { status: 403 })
  }

  if (new Date(order.token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: '다운로드 링크가 만료됐어요. 구매 내역에서 재발급하세요.' },
      { status: 410 }
    )
  }

  const currentCount = order.download_count    ?? 0
  const maxCount     = order.max_download_count ?? 5

  if (currentCount >= maxCount) {
    return NextResponse.json({
      error:   `다운로드 횟수(${maxCount}회)를 초과했어요. 링크를 재발급하세요.`,
      code:    'DOWNLOAD_LIMIT_EXCEEDED',
      current: currentCount,
      max:     maxCount,
    }, { status: 429 })
  }

  // ── 파일 경로 확인 ────────────────────────────────────────
  const template = order.templates
  if (!template?.download_url) {
    return NextResponse.json({ error: '파일 경로가 등록되지 않았어요' }, { status: 404 })
  }

  const basePath = template.download_url.replace(/\.zip$/, '')
  const pathMap: Record<string, string> = {
    source:  `${basePath}.zip`,
    guide:   `${basePath}-guide.pdf`,
    license: `${basePath}-license.txt`,
  }

  const filePath = type === 'all' ? pathMap['source'] : pathMap[type]
  if (!filePath) {
    return NextResponse.json({ error: '잘못된 파일 타입이에요' }, { status: 400 })
  }

  // ── Signed URL 생성 (5분) ─────────────────────────────────
  const { data: signed, error: dlErr } = await supabaseAdmin.storage
    .from('templates')
    .createSignedUrl(filePath, 60 * 5)

  if (dlErr || !signed) {
    return NextResponse.json({ error: '파일을 찾을 수 없어요' }, { status: 404 })
  }

  // ── 다운로드 횟수 원자적 증가 (RPC) ──────────────────────
  if (type === 'source' || type === 'all') {
    await supabaseAdmin.rpc('increment_order_download_count', {
      order_id: order.id,
    })
  }

  return NextResponse.redirect(signed.signedUrl)
}