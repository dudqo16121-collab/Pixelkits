import { ImageResponse } from 'next/og'
import { NextRequest }   from 'next/server'
import { createClient }  from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: t } = await supabase
    .from('templates')
    .select('name, description, price, category, rating, stack, thumbnail_url, badge')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!t) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(232,228,216,0.3)', fontSize: 24 }}>pixelkits</span>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  const priceStr = t.price === 0 ? '무료' : `₩${t.price.toLocaleString()}`
  const stack    = (t.stack ?? []).slice(0, 3).join(' · ')

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      padding: '60px 70px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', top: -100, left: -100,
        width: 400, height: 400,
        background: 'rgba(198,241,53,0.06)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        <span style={{ color: '#e8e4d8', fontSize: 22, fontWeight: 800 }}>pixelkits</span>
        <span style={{ color: '#c6f135', fontSize: 22, fontWeight: 800 }}>.</span>
      </div>

      {/* 본문 */}
      <div style={{ display: 'flex', gap: 48, alignItems: 'center', flex: 1 }}>

        {/* 텍스트 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* 카테고리 + 뱃지 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <span style={{
              color: 'rgba(232,228,216,0.4)', fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {t.category}
            </span>
            {t.badge && (
              <span style={{
                background: t.badge === 'hot' ? 'rgba(255,95,63,0.15)'
                  : t.badge === 'free' ? 'rgba(29,158,117,0.15)'
                  : 'rgba(198,241,53,0.15)',
                color: t.badge === 'hot' ? '#ff5f3f'
                  : t.badge === 'free' ? '#1d9e75'
                  : '#c6f135',
                fontSize: 11, fontWeight: 700,
                padding: '2px 10px', borderRadius: 100,
              }}>
                {t.badge.toUpperCase()}
              </span>
            )}
          </div>

          {/* 제목 */}
          <div style={{
            color: '#e8e4d8', fontSize: 52, fontWeight: 800,
            lineHeight: 1.08, letterSpacing: '-1px', marginBottom: 20,
          }}>
            {t.name}
          </div>

          {/* 설명 */}
          <div style={{
            color: 'rgba(232,228,216,0.5)', fontSize: 18,
            lineHeight: 1.6, marginBottom: 40,
            display: '-webkit-box',
            overflow: 'hidden',
          }}>
            {t.description?.slice(0, 100)}{(t.description?.length ?? 0) > 100 ? '...' : ''}
          </div>

          {/* 스택 태그 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {(t.stack ?? []).slice(0, 4).map((s: string) => (
              <span key={s} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(232,228,216,0.6)',
                fontSize: 13, padding: '4px 12px', borderRadius: 8,
              }}>
                {s}
              </span>
            ))}
          </div>

          {/* 가격 + 평점 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ color: '#c6f135', fontSize: 28, fontWeight: 800 }}>
              {priceStr}
            </span>
            {t.rating && (
              <span style={{ color: 'rgba(232,228,216,0.4)', fontSize: 16 }}>
                ★ {t.rating}
              </span>
            )}
          </div>
        </div>

        {/* 썸네일 */}
        {t.thumbnail_url && (
          <div style={{
            width: 340, height: 260,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}>
            <img
              src={t.thumbnail_url}
              alt={t.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}