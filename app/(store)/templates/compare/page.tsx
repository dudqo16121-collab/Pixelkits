import { notFound }            from 'next/navigation'
import Link                    from 'next/link'
import { getTemplatesBySlugs } from '@/lib/templates'
import { formatPrice }         from '@/lib/utils'
import type { Template }       from '@/types'

export const metadata = { title: '템플릿 비교 — pixelkits' }

interface Props { searchParams: { slugs?: string } }

export default async function ComparePage({ searchParams }: Props) {
  const slugs = (searchParams.slugs ?? '').split(',').filter(Boolean).slice(0, 3)
  if (slugs.length < 2) notFound()

  const templates = await getTemplatesBySlugs(slugs)
  if (templates.length < 2) notFound()

  const n = templates.length

  const ROWS: { label: string; key: string }[] = [
    { label: '카테고리',  key: 'category'       },
    { label: '가격',      key: 'price_display'  },
    { label: '기술 스택', key: 'stack_display'  },
    { label: '평점',      key: 'rating'         },
    { label: '다운로드',  key: 'download_count' },
    { label: '후기 수',   key: 'review_count'   },
    { label: '포함 기능', key: 'features_count' },
    { label: '섹션 수',   key: 'sections_count' },
    { label: '파일 크기', key: 'file_size_kb'   },
  ]

  function getValue(t: Template, key: string): string {
    switch (key) {
      case 'price_display':  return t.price === 0 ? '무료' : formatPrice(t.price)
      case 'stack_display':  return (t.stack ?? []).join(', ') || '—'
      case 'features_count': return `${(t.features ?? []).length}개`
      case 'sections_count': return `${(t.sections ?? []).length}개`
      case 'file_size_kb':   return t.file_size_kb ? `${(t.file_size_kb / 1024).toFixed(1)} MB` : '—'
      case 'download_count': return `${(t.download_count ?? 0).toLocaleString()}회`
      case 'review_count':   return `${t.review_count ?? 0}개`
      case 'rating':         return `★ ${t.rating ?? '—'}`
      case 'category':       return t.category
      default:               return String((t as any)[key] ?? '—')
    }
  }

  // 열 너비: 라벨 160px + 나머지 균등
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `160px repeat(${n}, 1fr)`,
    gap: '16px',
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">템플릿 비교</h1>
          <p className="text-[14px] text-sand/40">{templates.length}개 템플릿 비교 중</p>
        </div>
        <Link href="/templates" className="text-[13px] text-sand/50 hover:text-sand transition-colors">
          ← 목록으로
        </Link>
      </div>

      {/* 썸네일 + 이름 행 */}
      <div style={gridStyle} className="mb-6">
        <div /> {/* 라벨 자리 */}
        {templates.map((t) => (
          <div key={t.id} className="text-center">
            <div className="h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                            border border-white/10 mb-3">
              {t.thumbnail_url && (
                <img src={t.thumbnail_url} alt={t.name}
                  className="w-full h-full object-cover object-top" />
              )}
            </div>
            <h2 className="font-syne font-bold text-[14px] mb-1.5">{t.name}</h2>
            {t.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                t.badge === 'hot'  ? 'bg-[#ff5f3f]/15 text-[#ff5f3f]' :
                t.badge === 'new'  ? 'bg-teal/15 text-teal'           :
                t.badge === 'free' ? 'bg-lime/15 text-lime'           :
                                     'bg-amber-400/15 text-amber-400'
              }`}>
                {t.badge.toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 비교 테이블 */}
      <div className="card-base rounded-2xl overflow-hidden">
        {ROWS.map(({ label, key }, i) => (
          <div
            key={label}
            style={gridStyle}
            className={`px-5 py-4 items-center text-[13px]
                        ${i < ROWS.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
          >
            {/* 라벨 */}
            <span className="text-sand/40 font-medium">{label}</span>

            {/* 각 템플릿 값 */}
            {templates.map((t) => (
              <span key={t.id} className="text-sand/80 text-center">{getValue(t, key)}</span>
            ))}
          </div>
        ))}
      </div>

      {/* 구매 버튼 행 */}
      <div style={gridStyle} className="mt-6">
        <div />
        {templates.map((t) => (
          <div key={t.id} className="flex flex-col gap-2">
            <Link
              href={`/checkout?template=${t.slug}`}
              className="btn-lime w-full justify-center text-[13px] py-2.5 text-center rounded-xl">
              {t.price === 0 ? '무료 다운로드' : `${formatPrice(t.price)} 구매`}
            </Link>
            <Link
              href={`/templates/${t.slug}`}
              className="text-center text-[12px] text-sand/40 hover:text-sand transition-colors">
              상세 보기 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}