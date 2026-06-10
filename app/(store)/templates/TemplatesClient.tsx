'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { filterTemplates } from '@/lib/templates'
import { TemplateCard } from '@/components/ui/TemplateCard'
import { toggleWish as toggleWishDB } from '@/lib/wishlist'
import { supabase } from '@/lib/supabase'
import type { Template } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  all:       '전체',
  landing:   '랜딩페이지',
  saas:      'SaaS',
  portfolio: '포트폴리오',
  ecom:      '쇼핑몰',
  dashboard: '대시보드',
  blog:      '블로그',
}

const STACK_OPTIONS = ['nextjs', 'react', 'vue', 'html', 'astro']
const STACK_LABELS: Record<string, string> = {
  nextjs: 'Next.js', react: 'React', vue: 'Vue', html: 'HTML', astro: 'Astro',
}

export function TemplatesClient() {
  const router = useRouter()

  const [templates,  setTemplates]  = useState<Template[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [category,   setCategory]   = useState('all')
  const [sort,       setSort]       = useState('popular')
  const [stacks,     setStacks]     = useState<string[]>([])
  const [maxPrice,   setMaxPrice]   = useState(100)
  const [gridView,   setGridView]   = useState(true)
  const [wished,     setWished]     = useState<Set<string>>(new Set())
  const [userId,     setUserId]     = useState<string | null>(null)

  // 비교 기능
  const [compareList, setCompareList] = useState<string[]>([]) // slug 배열

  // 로그인 유저 + 찜 목록 로드
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase
        .from('wishlist')
        .select('template_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setWished(new Set(data.map((w) => w.template_id)))
        })
    })
  }, [])

  // 검색 debounce — 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 400)
    return () => clearTimeout(t)
  }, [query])

  // 템플릿 조회
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const data = await filterTemplates(
      category === 'all' ? undefined : category,
      debouncedQ,
      stacks.length > 0 ? stacks : undefined,
      maxPrice < 100 ? maxPrice * 1000 : undefined,
    )
    setTemplates(data)
    setLoading(false)
  }, [category, debouncedQ, stacks, maxPrice])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  // 카테고리별 카운트
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: templates.length }
    templates.forEach((t) => { map[t.category] = (map[t.category] ?? 0) + 1 })
    return map
  }, [templates])

  // 정렬
  const filtered = useMemo(() => {
    const arr = [...templates]
    if (sort === 'newest')     return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (sort === 'price-asc')  return arr.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return arr.sort((a, b) => b.price - a.price)
    return arr.sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
  }, [templates, sort])

  function toggleStack(s: string) {
    setStacks((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function toggleWish(templateId: string, e: React.MouseEvent) {
    e.preventDefault()
    if (!userId) { alert('로그인이 필요해요'); return }
    setWished((prev) => {
      const next = new Set(prev)
      next.has(templateId) ? next.delete(templateId) : next.add(templateId)
      return next
    })
    await toggleWishDB(userId, templateId)
  }

  // 비교 토글 — 최대 3개
  function toggleCompare(slug: string, e: React.MouseEvent) {
    e.preventDefault()
    setCompareList((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 3) { alert('최대 3개까지 비교할 수 있어요'); return prev }
      return [...prev, slug]
    })
  }

  function resetFilters() {
    setQuery(''); setCategory('all'); setSort('popular')
    setStacks([]); setMaxPrice(100)
  }

  const CATEGORIES = Object.keys(CATEGORY_LABELS).map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
    count: value === 'all' ? templates.length : (counts[value] ?? 0),
  }))

  return (
    <div>
      {/* ── 상단: 검색 + 카테고리 탭 ── */}
      <div className="px-8 pt-10 pb-0 border-b border-white/[0.07]">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">모든 템플릿</h1>
        <p className="text-[14px] text-sand/40 font-light mb-5">프리미엄 프론트엔드 템플릿</p>

        <div className="flex gap-3 items-center mb-5">
          {/* 검색 — debounce 적용 */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="템플릿 이름, 기술 스택, 카테고리 검색..."
              className="w-full bg-panel border border-white/10 rounded-xl py-3 pl-11 pr-10
                         text-[14px] text-sand placeholder:text-sand/20
                         outline-none focus:border-lime/40 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sand/30
                           hover:text-sand transition-colors cursor-pointer text-lg">
                ✕
              </button>
            )}
          </div>

          {/* 정렬 */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-panel border border-white/10 rounded-xl px-4 py-3 text-[13px]
                       text-sand/70 outline-none cursor-pointer min-w-[130px]"
          >
            <option value="popular">인기순</option>
            <option value="newest">최신순</option>
            <option value="price-asc">낮은 가격순</option>
            <option value="price-desc">높은 가격순</option>
          </select>

          {/* 뷰 전환 */}
          <div className="flex gap-1">
            {[true, false].map((isGrid) => (
              <button
                key={String(isGrid)}
                onClick={() => setGridView(isGrid)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center
                            text-sm transition-all cursor-pointer
                  ${gridView === isGrid
                    ? 'border-lime/30 bg-lime/[0.08] text-lime'
                    : 'border-white/10 text-sand/30 hover:border-white/20'}`}>
                {isGrid ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`px-4 py-2.5 text-[13px] whitespace-nowrap border-b-2 transition-all cursor-pointer
                ${category === value
                  ? 'text-sand font-medium border-lime'
                  : 'text-sand/40 border-transparent hover:text-sand/70'}`}>
              {label}{' '}
              <span className="text-sand/25 text-[12px]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 사이드바 + 그리드 ── */}
      <div className="flex">

        {/* 필터 사이드바 */}
        <aside className="w-56 flex-shrink-0 border-r border-white/[0.07] p-5 min-h-full">

          {/* 카테고리 */}
          <div className="mb-6">
            <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">카테고리</p>
            <div className="space-y-0.5">
              {CATEGORIES.map(({ value, label, count }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                              text-[13px] cursor-pointer transition-all
                    ${category === value
                      ? 'bg-lime/[0.08] text-sand font-medium'
                      : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${category === value ? 'bg-lime' : 'bg-white/15'}`} />
                    {label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                    ${category === value ? 'bg-lime/15 text-lime' : 'bg-white/[0.05] text-sand/25'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 가격 슬라이더 */}
          <div className="mb-6">
            <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">가격대</p>
            <div className="flex justify-between text-[12px] text-sand/40 mb-2">
              <span>무료</span>
              <span>{maxPrice === 100 ? '전체' : `₩${(maxPrice * 1000).toLocaleString()}`}</span>
            </div>
            <input
              type="range" min={0} max={100} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-lime cursor-pointer"
            />
          </div>

          {/* 스택 필터 */}
          <div className="mb-6">
            <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">기술 스택</p>
            <div className="space-y-1.5">
              {STACK_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={stacks.includes(s)} onChange={() => toggleStack(s)} className="hidden" />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center
                    flex-shrink-0 transition-all
                    ${stacks.includes(s) ? 'bg-lime border-lime' : 'bg-transparent border-white/15'}`}>
                    {stacks.includes(s) && <span className="text-ink text-[10px] font-bold">✓</span>}
                  </span>
                  <span className={`text-[13px] transition-colors
                    ${stacks.includes(s) ? 'text-sand' : 'text-sand/50 group-hover:text-sand/80'}`}>
                    {STACK_LABELS[s] ?? s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 초기화 */}
          <button
            onClick={resetFilters}
            className="w-full border border-white/[0.08] rounded-lg py-2 text-[12px]
                       text-sand/35 hover:border-white/20 hover:text-sand/70
                       transition-all cursor-pointer">
            ↺ 필터 초기화
          </button>
        </aside>

        {/* 템플릿 그리드 */}
        <div className="flex-1 px-7 pt-6 pb-16">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <p className="text-[13px] text-sand/40">
              {loading
                ? '검색 중...'
                : <><span className="text-sand font-medium">{filtered.length}</span>개 템플릿</>}
            </p>
            <div className="flex gap-2 flex-wrap">
              {stacks.map((s) => (
                <span key={s} onClick={() => toggleStack(s)}
                  className="flex items-center gap-1 bg-lime/10 border border-lime/20 text-lime
                             text-[11px] px-2.5 py-1 rounded-full cursor-pointer hover:bg-lime/20 transition-colors">
                  {STACK_LABELS[s] ?? s} ✕
                </span>
              ))}
            </div>
          </div>

          {/* 로딩 스켈레톤 */}
          {loading && (
            <div className={`grid ${gridView ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-base rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-white/[0.04]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
                    <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
                    <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 결과 없음 */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-sand/30">
              <p className="text-4xl mb-3">:(</p>
              <p className="text-[14px]">검색 결과가 없어요</p>
              <p className="text-[12px] mt-1 mb-5">
                {debouncedQ ? `"${debouncedQ}"에 대한 결과가 없어요` : '다른 필터를 시도해보세요'}
              </p>
              <button onClick={resetFilters}
                className="text-lime/70 hover:text-lime transition-colors text-[13px] cursor-pointer">
                필터 초기화하기
              </button>
            </div>
          )}

          {/* 카드 목록 */}
          {!loading && filtered.length > 0 && (
            <div className={gridView
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'}>
              {filtered.map((t) => (
                <div key={t.id} className="relative group">

                  {/* 찜 버튼 */}
                  <button
                    onClick={(e) => toggleWish(t.id, e)}
                    className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full
                               flex items-center justify-center text-[13px]
                               bg-black/40 border border-white/10 transition-all cursor-pointer
                               opacity-0 group-hover:opacity-100
                               ${wished.has(t.id) ? 'text-[#ff5f3f] opacity-100' : 'text-sand/60 hover:text-[#ff5f3f]'}`}>
                    {wished.has(t.id) ? '♥' : '♡'}
                  </button>

                  {/* 비교 버튼 */}
                  <button
                    onClick={(e) => toggleCompare(t.slug, e)}
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full
                               flex items-center justify-center text-[11px] font-bold
                               border transition-all cursor-pointer
                               ${compareList.includes(t.slug)
                                 ? 'bg-lime text-ink border-lime opacity-100'
                                 : 'bg-black/40 border-white/10 text-sand/60 opacity-0 group-hover:opacity-100 hover:border-lime/50 hover:text-lime'}`}>
                    {compareList.includes(t.slug) ? '✓' : '≡'}
                  </button>

                  <TemplateCard template={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 비교 플로팅 바 ── */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                        bg-[#111] border border-white/15 rounded-2xl shadow-2xl
                        px-5 py-3 flex items-center gap-4">
          <p className="text-[13px] text-sand/50">
            <span className="text-sand font-medium">{compareList.length}개</span> 선택됨
          </p>
          <div className="flex gap-2">
            {compareList.map((slug) => {
              const t = filtered.find((x) => x.slug === slug)
              return (
                <span key={slug}
                  className="text-[12px] bg-lime/10 border border-lime/20 text-lime px-2.5 py-1 rounded-full flex items-center gap-1">
                  {t?.name ?? slug}
                  <button onClick={() => setCompareList((p) => p.filter((s) => s !== slug))}
                    className="text-lime/50 hover:text-lime cursor-pointer ml-0.5">✕</button>
                </span>
              )
            })}
          </div>
          <Link
            href={`/templates/compare?slugs=${compareList.join(',')}`}
            className="btn-lime text-[13px] px-4 py-2">
            비교하기 →
          </Link>
          <button onClick={() => setCompareList([])}
            className="text-sand/30 hover:text-sand transition-colors cursor-pointer text-[13px]">
            취소
          </button>
        </div>
      )}
    </div>
  )
}