import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/promo/validate
// body: { code: string, templateSlug: string }

export async function POST(req: NextRequest) {
  try {
    const { code, templateSlug } = await req.json()
    if (!code || !templateSlug) {
      return NextResponse.json({ error: '코드 또는 템플릿 정보가 누락됐어요' }, { status: 400 })
    }

    // 1. 프로모 코드 조회
    const { data: promo, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !promo) {
      return NextResponse.json({ error: '유효하지 않은 코드입니다' }, { status: 400 })
    }

    // 2. 만료 확인
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 코드입니다' }, { status: 400 })
    }

    // 3. 사용 횟수 확인
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ error: '사용 횟수가 초과된 코드입니다' }, { status: 400 })
    }

    // 4. 템플릿 가격 조회해서 할인 금액 계산
    const { data: template } = await supabaseAdmin
      .from('templates')
      .select('price')
      .eq('slug', templateSlug)
      .single()

    if (!template) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없어요' }, { status: 404 })
    }

    const discountAmount = Math.round(template.price * (promo.discount_percent / 100))

    return NextResponse.json({
      valid:           true,
      discountPercent: promo.discount_percent,
      discountAmount,
    })
  } catch (err) {
    console.error('[API] /promo/validate 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}
