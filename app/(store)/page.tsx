import Link from 'next/link'
import { TemplateCard } from '@/components/ui/TemplateCard'
import { Badge } from '@/components/ui/Badge'
import { getTemplates } from '@/lib/templates'

export default async function HomePage() {
  const templates = await getTemplates()
  const featured  = templates[0]
  const recent    = templates.slice(0, 6)

  return (
    <>
      {/* 히어로 */}
      <section className="px-8 pt-16 pb-12 border-b border-white/[0.06]">
        <Badge variant="lime" className="mb-6">✦ 새 템플릿 매주 업데이트</Badge>
        <h1 className="font-syne font-extrabold text-[clamp(36px,6vw,62px)] leading-[1.05] tracking-tight mb-5 max-w-2xl">
          개발 시간을 줄이고
          <br />
          <span className="text-transparent [-webkit-text-stroke:1px_rgba(200,241,53,0.7)]">더 멋진</span>{' '}
          사이트를
          <br />더 빠르게.
        </h1>
        <p className="text-[15px] text-sand/50 font-light leading-relaxed max-w-md mb-9">
          프로 디자이너가 제작한 프론트엔드 템플릿.
          바로 쓸 수 있는 코드로 납품 속도를 3배 높이세요.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/templates" className="btn-lime">템플릿 보기 →</Link>
          {featured && (
            <Link href={`/preview/${featured.slug}`} className="btn-ghost">▶ 라이브 데모</Link>
          )}
        </div>
      </section>

      {/* 통계 바 */}
      <div className="flex gap-8 px-8 py-6 border-b border-white/[0.06] overflow-x-auto">
        {[
          { num: '120+',               label: '프리미엄 템플릿' },
          { num: '4,800+',             label: '다운로드' },
          { num: '4.9 ★',             label: '평균 평점' },
          { num: 'Next.js · React · HTML', label: '지원 스택' },
        ].map(({ num, label }) => (
          <div key={label} className="flex flex-col gap-0.5 min-w-fit">
            <span className="font-syne font-bold text-xl text-sand">{num}</span>
            <span className="text-[12px] text-sand/35">{label}</span>
          </div>
        ))}
      </div>

      {/* 피처드 */}
      {featured && (
        <section className="mx-8 my-10 card-base overflow-hidden grid md:grid-cols-2">
          <div className="p-10">
            <Badge variant="hot" className="mb-5">🔥 이번 주 베스트셀러</Badge>
            <h2 className="font-syne font-extrabold text-2xl leading-tight tracking-tight mb-3">
              {featured.name}
            </h2>
            <p className="text-[14px] text-sand/50 font-light leading-relaxed mb-6">
              {featured.description}
            </p>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-syne font-extrabold text-3xl text-lime">
                ₩{featured.price.toLocaleString()}
              </span>
              {featured.original_price > featured.price && (
                <span className="text-[14px] text-sand/30 line-through">
                  ₩{featured.original_price.toLocaleString()}
                </span>
              )}
            </div>
            <Link href={`/templates/${featured.slug}`} className="btn-lime">지금 구매 →</Link>
          </div>
<div className="relative min-h-[240px] overflow-hidden">
  {featured.thumbnail_url ? (
    // 썸네일 있으면 실제 이미지
    <img
      src={featured.thumbnail_url}
      alt={featured.name}
      className="w-full h-full object-cover object-top absolute inset-0"
    />
  ) : (
    // 없으면 기존 목업
    <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] flex items-center justify-center p-8 h-full absolute inset-0 w-full">
      <div className="w-[88%] bg-[#1a1a2a] rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-[#252535] h-7 flex items-center gap-1.5 px-3">
          {['#ff5f57','#febc2e','#28c840'].map((c) => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="h-36 bg-[#0d1b2a] p-3 flex flex-col gap-2">
          <div className="h-10 bg-white/[0.06] rounded flex items-center px-3 gap-2">
            <div className="w-6 h-6 rounded bg-lime/20" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/5 bg-white/10 rounded" />
              <div className="h-1.5 w-2/5 bg-lime/15 rounded" />
            </div>
          </div>
          <div className="flex gap-1.5 flex-1">
            {[0,1,2].map((i) => (
              <div key={i} className="flex-1 bg-white/[0.05] rounded border border-white/[0.07]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )}
</div>
        </section>
      )}

      {/* 템플릿 그리드 */}
      <section className="px-8 pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-syne font-bold text-xl">전체 템플릿</h2>
          <Link href="/templates" className="text-[13px] text-lime hover:opacity-75 transition-opacity">
            전체 보기 →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-16 text-sand/30">
            <p className="text-[14px]">아직 등록된 템플릿이 없어요</p>
            <p className="text-[12px] mt-1">Supabase에서 템플릿을 추가해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recent.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
