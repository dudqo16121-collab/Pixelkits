import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTemplateBySlug } from '@/lib/templates'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, discountPercent } from '@/lib/utils'
import { ReviewSection } from '@/components/sections/ReviewSection'

// 기존 Props 인터페이스 활용
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const template = await getTemplateBySlug(params.slug)
  if (!template) return { title: '템플릿을 찾을 수 없어요' }

  const title       = template.name
  const description = template.description ?? `${template.name} — pixelkits 프론트엔드 템플릿`
  const imageUrl    = template.thumbnail_url ?? '/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title:       `${title} — pixelkits`,
      description,
      url:         `https://pixelkits.co/templates/${params.slug}`,
      images: [{
        url:    imageUrl,
        width:  1200,
        height: 630,
        alt:    title,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${title} — pixelkits`,
      description,
      images:      [imageUrl],
    },
  }
}

interface Props {
  params: { slug: string }
}

export default async function TemplatePage({ params }: Props) {
  const template = await getTemplateBySlug(params.slug)
  if (!template) notFound()

  const discount = discountPercent(template.original_price, template.price)

  return (
    <div className="grid md:grid-cols-[1fr_320px] min-h-[calc(100vh-57px)]">

      {/* ── 왼쪽: 상세 정보 ── */}
      <div className="p-8 border-r border-white/[0.07]">

        {/* 뱃지 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="lime">{template.category}</Badge>
          {template.stack?.map((s) => (
            <Badge key={s} variant="gray">{s}</Badge>
          ))}
          {template.badge === 'hot' && <Badge variant="hot">🔥 베스트셀러</Badge>}
          {template.badge === 'new' && <Badge variant="lime">✨ NEW</Badge>}
        </div>

        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2">
          {template.name}
        </h1>
        <p className="text-[14px] text-sand/50 font-light leading-relaxed mb-7">
          {template.description}
        </p>

        {/* ── 미리보기 영역 ── */}
        <div className="card-base overflow-hidden mb-7">
          {/* 브라우저 툴바 */}
          <div className="bg-[#1a1a1a] border-b border-white/[0.07] px-4 py-2.5 flex items-center gap-3">
            {['#ff5f57','#febc2e','#28c840'].map((c) => (
              <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
            <div className="flex-1 bg-white/[0.05] rounded px-3 py-1 text-[11px] text-sand/25 truncate">
              {template.preview_url}
            </div>
            <Link href={`/preview/${template.slug}`}
              className="text-[11px] text-lime border border-lime/25 bg-lime/10 rounded px-2.5 py-1
                         hover:bg-lime/20 transition-colors whitespace-nowrap">
              ⛶ 전체화면
            </Link>
          </div>

          {/* 미리보기 — 썸네일 있으면 이미지, 없으면 iframe */}
          <div className="relative h-[480px] bg-ink overflow-hidden">
            {template.thumbnail_url ? (
              <>
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full h-full object-cover object-top"
                />
                <Link href={`/preview/${template.slug}`}
                  className="absolute inset-0 flex items-center justify-center
                             bg-ink/0 hover:bg-ink/60 transition-colors group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity
                                   bg-panel border border-white/15 rounded-xl px-5 py-3
                                   text-[13px] font-medium flex items-center gap-2 shadow-xl">
                    ⛶ 전체화면으로 보기
                  </span>
                </Link>
              </>
            ) : (
              <>
                <iframe
                  src={template.preview_url}
                  className="border-0 pointer-events-none absolute top-0 left-0"
                  title={`${template.name} 미리보기`}
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '150%',
                    height: '150%',
                    transform: 'scale(0.667)',
                    transformOrigin: 'top left',
                  }}
                />
                <Link href={`/preview/${template.slug}`}
                  className="absolute inset-0 flex items-center justify-center
                             bg-ink/0 hover:bg-ink/60 transition-colors group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity
                                   bg-panel border border-white/15 rounded-xl px-5 py-3
                                   text-[13px] font-medium flex items-center gap-2 shadow-xl">
                    ⛶ 전체화면으로 보기
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* 탭 */}
          <div className="flex gap-0 border-t border-white/[0.07] px-4 pt-1">
            {['포함 내용', '기능 상세', '구매 후기'].map((tab, i) => (
              <button key={tab}
                className={`px-4 py-2.5 text-[13px] transition-colors cursor-pointer
                  ${i === 0
                    ? 'text-sand font-medium border-b-2 border-lime'
                    : 'text-sand/40 hover:text-sand/70'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── 포함 파일 ── */}
        <h2 className="font-syne font-bold text-[13px] text-sand/40 uppercase tracking-wider mb-3">
          포함 파일
        </h2>
        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {[
            { icon: '⬡', label: 'Next.js 소스코드', sub: 'App Router 기반' },
            { icon: '⊞', label: '컴포넌트 파일',    sub: '12개 섹션 분리' },
            { icon: '◈', label: '에셋 & 아이콘',    sub: 'SVG 포함' },
            { icon: '≡', label: '설치 가이드',       sub: '한국어 문서' },
            { icon: '↻', label: '평생 업데이트',     sub: '무료 패치 제공' },
            { icon: '✦', label: '상업적 라이선스',   sub: '클라이언트 납품 가능' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 card-base p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-lime/10 border border-lime/15
                              flex items-center justify-center text-lime text-base flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-[13px] text-sand/80">{label}</p>
                <p className="text-[11px] text-sand/35">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 섹션 구성 ── */}
        <h2 className="font-syne font-bold text-[13px] text-sand/40 uppercase tracking-wider mb-3">
          섹션 구성
        </h2>
        <div className="flex flex-col gap-2 mb-2">
          {(template.features ?? []).length > 0 ? (
            template.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[13px] text-sand/65">
                <span className="text-lime mt-0.5">✓</span> {f}
              </div>
            ))
          ) : (
            <p className="text-[13px] text-sand/25">등록된 기능 목록이 없어요</p>
          )}
        </div>

        {/* ── 구매 후기 ── */}
        <div className="mt-12 pt-10 border-t border-white/[0.07]">
          <h2 className="font-syne font-bold text-[13px] text-sand/40 uppercase tracking-wider mb-6">
            구매 후기
          </h2>
          <ReviewSection templateId={template.id} />
        </div>

      </div>

      {/* ── 오른쪽: 구매 패널 ── */}
      <div className="p-6 bg-[#0d0d0d]">
        <div className="card-base rounded-2xl p-6 mb-4 sticky top-6">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-syne font-extrabold text-3xl text-lime">
              {formatPrice(template.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-[15px] text-sand/30 line-through">
                  {formatPrice(template.original_price)}
                </span>
                <span className="text-[11px] font-bold text-[#ff5f3f] bg-[#ff5f3f]/15
                                 border border-[#ff5f3f]/20 rounded-full px-2 py-0.5">
                  -{discount}%
                </span>
              </>
            )}
          </div>
          <p className="text-[12px] text-sand/35 mb-5">부가세 포함 · 1회 결제 · 평생 사용</p>

          <Link href={`/checkout?template=${template.slug}`}
            className="btn-lime w-full justify-center text-[15px] py-4 rounded-xl mb-2.5">
            🛒 지금 구매하기
          </Link>

          <Link href={`/preview/${template.slug}`}
            className="flex items-center justify-center gap-2 w-full
                       border border-white/12 rounded-xl py-3.5 mb-5
                       text-[14px] text-sand/60 hover:text-sand hover:border-white/30 transition-all">
            ⛶ 라이브 미리보기
          </Link>

          <div className="flex items-center gap-2.5 bg-teal/[0.07] border border-teal/15
                          rounded-xl p-3 mb-5 text-[12px] text-teal/90">
            <span className="text-base">🛡</span>
            <span>7일 환불 보장 — 만족 못하면 전액 환불</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { k: '파일 형식', v: '.zip' },
              { k: '업데이트', v: '평생 무료' },
              { k: '라이선스', v: '상업적 사용 가능' },
              { k: '다운로드', v: '결제 즉시 제공' },
              { k: '파일 크기', v: template.file_size_kb
                  ? `${(template.file_size_kb / 1024).toFixed(1)} MB`
                  : '—' },
              { k: '평점', v: `★ ${template.rating ?? '—'}` },
            ].map(({ k, v }) => (
              <div key={k}>
                <div className="flex justify-between text-[13px] py-2">
                  <span className="text-sand/40">{k}</span>
                  <span className="text-sand">{v}</span>
                </div>
                <div className="h-px bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}