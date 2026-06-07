'use client'
import { useState } from 'react'

export const metadata = {
  title:       'FAQ',
  description: 'pixelkits 자주 묻는 질문. 라이선스, 환불, 다운로드, 커스터마이징 관련 안내.',
}

const FAQS = [
  { cat: 'purchase', q: '어떤 결제 수단을 지원하나요?',        a: '신용·체크카드, 토스페이, 카카오페이를 지원합니다.' },
  { cat: 'purchase', q: '환불 정책은 어떻게 되나요?',          a: '7일 환불 보장. 파일을 다운로드한 경우 제한될 수 있으니 문의해주세요.' },
  { cat: 'purchase', q: '구독인가요, 일회성 결제인가요?',       a: '일회성 결제입니다. 한 번 구매하면 평생 업데이트를 무료로 받습니다.' },
  { cat: 'download', q: '결제 후 파일은 어떻게 받나요?',       a: '결제 완료 페이지에서 즉시 다운로드 가능하며, 이메일로도 링크가 발송됩니다.' },
  { cat: 'download', q: '다운로드 링크가 만료됐어요.',          a: '링크는 72시간 유효합니다. 구매 내역 페이지에서 재발급하거나 이메일로 문의해주세요.' },
  { cat: 'license',  q: '클라이언트 프로젝트에 사용해도 되나요?', a: '네, 상업적 사용이 가능합니다. 클라이언트 납품 프로젝트에 자유롭게 사용하세요.' },
  { cat: 'license',  q: '템플릿을 수정해서 재판매할 수 있나요?', a: '템플릿 자체를 다른 마켓에 재판매하는 것은 금지됩니다.' },
  { cat: 'tech',     q: 'Next.js 버전은 무엇인가요?',          a: '최신 템플릿은 Next.js 14 (App Router) 기반입니다.' },
  { cat: 'tech',     q: '어떻게 설치하나요?',                   a: 'ZIP 다운로드 → npm install → npm run dev. 한국어 설치 가이드 PDF가 포함됩니다.' },
  { cat: 'tech',     q: 'Vercel 외 다른 곳에 배포 가능한가요?', a: 'Netlify, AWS, Cloudflare Pages 등 Node.js를 지원하는 모든 플랫폼에 배포 가능합니다.' },
]

const CATS = [
  { v: 'all',      l: '전체' },
  { v: 'purchase', l: '구매 & 결제' },
  { v: 'download', l: '다운로드' },
  { v: 'license',  l: '라이선스' },
  { v: 'tech',     l: '기술 & 설치' },
]

export default function FaqPage() {
  const [cat,     setCat]     = useState('all')
  const [query,   setQuery]   = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const filtered = FAQS.filter((f) =>
    (cat === 'all' || f.cat === cat) &&
    (!query || f.q.includes(query) || f.a.includes(query))
  )

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <span className="badge-lime mb-4 inline-block">❓ 자주 묻는 질문</span>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-3">무엇이든 물어보세요</h1>
        <p className="text-[14px] text-sand/40 font-light">찾는 답이 없으면 하단에서 직접 문의해 주세요</p>
      </div>

      {/* 검색 */}
      <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="질문 검색... (예: 환불, 라이선스, 설치)"
          className="w-full bg-panel border border-white/10 rounded-2xl py-4 pl-12 pr-4
                     text-[14px] text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        {/* 카테고리 사이드바 */}
        <div>
          <div className="space-y-1 mb-8">
            {CATS.map(({ v, l }) => (
              <button key={v} onClick={() => setCat(v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer
                  ${cat === v ? 'bg-lime/[0.08] text-sand font-medium' : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat === v ? 'bg-lime' : 'bg-white/15'}`} />
                  {l}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${cat === v ? 'bg-lime/15 text-lime' : 'bg-white/[0.05] text-sand/25'}`}>
                  {v === 'all' ? FAQS.length : FAQS.filter(f => f.cat === v).length}
                </span>
              </button>
            ))}
          </div>
          <div className="card-base rounded-xl p-4">
            <p className="font-syne font-bold text-[13px] mb-2">답을 못 찾으셨나요?</p>
            <p className="text-[12px] text-sand/40 leading-relaxed mb-3">평균 2시간 내로 답변드려요.</p>
            <button className="btn-ghost w-full justify-center py-2 text-[12px]">📧 이메일 문의</button>
          </div>
        </div>

        {/* FAQ 목록 */}
        <div>
          <p className="text-[13px] text-sand/35 mb-4">
            <span className="text-sand font-medium">{filtered.length}</span>개 질문
          </p>
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-sand/30">
                <p className="text-2xl mb-2">:(</p>
                <p>검색 결과가 없어요</p>
              </div>
            ) : filtered.map((f, i) => (
              <div key={i} onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className={`card-base rounded-xl overflow-hidden cursor-pointer transition-colors
                  ${openIdx === i ? 'border-lime/20' : 'hover:border-white/14'}`}>
                <div className="flex items-center justify-between gap-4 p-5">
                  <span className={`text-[14px] font-medium flex-1 ${openIdx === i ? 'text-lime' : ''}`}>
                    {f.q}
                  </span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm transition-all
                    ${openIdx === i
                      ? 'bg-lime/12 text-lime rotate-45'
                      : 'bg-white/[0.05] text-sand/40'}`}>+</span>
                </div>
                {openIdx === i && (
                  <div className="px-5 pb-5 text-[13px] text-sand/60 font-light leading-relaxed border-t border-white/[0.06] pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
