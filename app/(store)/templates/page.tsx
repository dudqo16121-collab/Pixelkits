'use client'

import { useState, useEffect } from 'react'
import { TemplateCard } from '@/components/ui/TemplateCard'
import { filterTemplates } from '@/lib/templates'
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

const STACKS = ['Next.js', 'React', 'Vue.js', 'HTML/CSS', 'Astro']

export default function TemplatesPage() {
  const [query,      setQuery]      = useState('')
  const [category,   setCategory]   = useState('all')
  const [sort,       setSort]       = useState('popular')
  const [stacks,     setStacks]     = useState<string[]>([])
  const [maxPrice,   setMaxPrice]   = useState(100)
  const [gridView,   setGridView]   = useState(true)
  const [wished,     setWished]     = useState<Set<string>>(new Set())
  const [filtered,   setFiltered]   = useState<Template[]>([])
  const [loading,    setLoading]    = useState(true)
  const [counts,     setCounts]     = useState<Record<string, number>>({})  // ← 추가

  // 카테고리별 실제 개수 조회
  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase
        .from('templates')
        .select('category')
        .eq('is_published', true)

      if (!data) return

      const result: Record<string, number> = { all: data.length }
      data.forEach(({ category }) => {
        result[category] = (result[category] ?? 0) + 1
      })
      setCounts(result)
    }
    fetchCounts()
  }, [])

useEffect(() => {
  setLoading(true)
  filterTemplates(
    category,
    query,
    stacks,
    maxPrice < 100 ? maxPrice * 500 : undefined
  ).then((data) => {
    setFiltered(data)
    setLoading(false)
  })
}, [query, category, stacks, maxPrice])

  function toggleStack(s: string) {
    setStacks((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleWish(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setWished((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetFilters() {
    setQuery(''); setCategory('all'); setSort('popular')
    setStacks([]); setMaxPrice(100)
  }

  // 카테고리 목록 — 실제 개수 사용
  const CATEGORIES = Object.keys(CATEGORY_LABELS).map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
    count: counts[value] ?? 0,
  }))

  return (
    <div>
      {/* 상단 검색바 + 카테고리 탭 */}
      <div className="px-8 pt-10 pb-0 border-b border-white/[0.07]">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">모든 템플릿</h1>
        <p className="text-[14px] text-sand/40 font-light mb-5">프리미엄 프론트엔드 템플릿</p>

        <div className="flex gap-3 items-center mb-5">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="템플릿 이름, 기술 스택, 카테고리 검색..."
              className="w-full bg-panel border border-white/10 rounded-xl py-3 pl-11 pr-4
                         text-[14px] text-sand placeholder:text-sand/20
                         outline-none focus:border-lime/40 transition-colors" />
          </div>

          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="bg-panel border border-white/10 rounded-xl px-4 py-3 text-[13px]
                       text-sand/70 outline-none cursor-pointer min-w-[130px]">
            <option value="popular">인기순</option>
            <option value="newest">최신순</option>
            <option value="price-asc">낮은 가격순</option>
            <option value="price-desc">높은 가격순</option>
          </select>

          <div className="flex gap-1">
            {[true, false].map((isGrid) => (
              <button key={String(isGrid)} onClick={() => setGridView(isGrid)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer
                  ${gridView === isGrid
                    ? 'bg-lime/10 border-lime/30 text-lime'
                    : 'bg-transparent border-white/10 text-sand/40 hover:text-sand'}`}>
                {isGrid ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 탭 — 실제 개수 */}
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(({ value, label, count }) => (
            <button key={value} onClick={() => setCategory(value)}
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

      {/* 사이드바 + 그리드 */}
      <div className="flex">
        <aside className="w-56 flex-shrink-0 border-r border-white/[0.07] p-5 min-h-full">
          {/* 카테고리 사이드바 — 실제 개수 */}
          <div className="mb-6">
            <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">카테고리</p>
            <div className="space-y-0.5">
              {CATEGORIES.map(({ value, label, count }) => (
                <button key={value} onClick={() => setCategory(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] cursor-pointer transition-all
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
              <span>{maxPrice === 100 ? '전체' : `₩${(maxPrice * 500).toLocaleString()} 이하`}</span>
            </div>
            <input type="range" min={0} max={100} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-lime cursor-pointer" />
          </div>

          {/* 기술 스택 */}
          <div className="mb-6">
            <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">기술 스택</p>
            <div className="space-y-2">
              {STACKS.map((s) => (
                <label key={s} className="flex items-center gap-2.5 text-[13px] text-sand/60 cursor-pointer">
                  <span onClick={() => toggleStack(s)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                      ${stacks.includes(s) ? 'bg-lime border-lime' : 'bg-transparent border-white/15'}`}>
                    {stacks.includes(s) && <span className="text-ink text-[10px] font-bold">✓</span>}
                  </span>
                  {s}
                </label>
              ))}
            </div>
          </div>

          <button onClick={resetFilters}
            className="w-full border border-white/[0.08] rounded-lg py-2 text-[12px]
                       text-sand/35 hover:border-white/20 hover:text-sand/70 transition-all cursor-pointer">
            ↺ 필터 초기화
          </button>
        </aside>

        {/* 그리드 */}
        <div className="flex-1 px-7 pt-6 pb-16">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <p className="text-[13px] text-sand/40">
              <span className="text-sand font-medium">{filtered.length}</span>개 템플릿
            </p>
            <div className="flex gap-2 flex-wrap">
              {stacks.map((s) => (
                <span key={s} onClick={() => toggleStack(s)}
                  className="flex items-center gap-1 bg-lime/10 border border-lime/20 text-lime
                             text-[11px] px-2.5 py-1 rounded-full cursor-pointer hover:bg-lime/20 transition-colors">
                  {s} ✕
                </span>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-sand/30">
              <div className="w-6 h-6 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-3" />
              불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sand/30">
              <p className="text-4xl mb-3">:(</p>
              <p className="text-[14px]">검색 결과가 없어요</p>
              <p className="text-[12px] mt-1">다른 키워드나 필터를 시도해보세요</p>
            </div>
          ) : (
            <div className={gridView
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'}>
              {filtered.map((t) => (
                <div key={t.id} className="relative group">
                  <button
                    onClick={(e) => toggleWish(t.id, e)}
                    className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full
                               flex items-center justify-center text-[13px]
                               bg-black/40 border border-white/10 transition-all cursor-pointer
                               opacity-0 group-hover:opacity-100
                               ${wished.has(t.id) ? '!opacity-100 text-red-400' : 'text-sand/40'}`}>
                    ♥
                  </button>
                  <TemplateCard template={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}