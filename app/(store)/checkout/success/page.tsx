import Link from 'next/link'
import { getTemplateBySlug } from '@/lib/templates'
import { formatPrice, formatDate } from '@/lib/utils'

interface Props {
  searchParams: { template?: string; email?: string }
}

export default function SuccessPage({ searchParams }: Props) {
  const template = getTemplateBySlug(searchParams.template ?? '')
  const email    = decodeURIComponent(searchParams.email ?? 'your@email.com')
  const orderNum = `PKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-8821`

  return (
    <div>
      {/* 히어로 */}
      <div className="text-center px-8 py-14 border-b border-white/[0.06]">
        <div className="w-16 h-16 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center text-lime text-2xl mx-auto mb-5">
          ✓
        </div>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2">결제가 완료됐어요!</h1>
        <p className="text-[14px] text-sand/45 font-light mb-4">
          구매해주셔서 감사합니다. 아래에서 바로 다운로드하세요.
        </p>
        <span className="inline-flex items-center gap-2 bg-panel border border-white/[0.08] rounded-full px-4 py-1.5 text-[12px] text-sand/40">
          주문번호 <span className="text-lime font-syne font-bold">#{orderNum}</span>
        </span>
      </div>

      {/* 본문 */}
      <div className="grid md:grid-cols-[1fr_320px] max-w-5xl mx-auto px-8 py-10 gap-10">
        {/* 다운로드 카드 */}
        <div>
          <div className="card-base rounded-2xl p-6 mb-6 relative overflow-hidden">
            {/* 상단 그라데이션 라인 */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime via-teal to-lime" />

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] border border-white/10 flex-shrink-0" />
              <div>
                <h2 className="font-syne font-bold text-[16px]">
                  {template?.name ?? 'pixelkits 템플릿'}
                </h2>
                <div className="flex gap-3 text-[12px] text-sand/35 mt-1">
                  <span>⬡ {template?.stack[0] ?? 'Next.js'}</span>
                  <span>✦ 상업적 라이선스</span>
                  <span>↻ 평생 업데이트</span>
                </div>
              </div>
            </div>

            {/* 파일 목록 */}
            <div className="space-y-2.5 mb-5">
              {[
                { icon: '🗜', name: `${template?.slug ?? 'template'}-v1.2.zip`, size: '소스코드 전체 · 4.8 MB' },
                { icon: '📄', name: '설치-가이드-한국어.pdf',                   size: '설치 가이드 · 1.1 MB' },
                { icon: '📋', name: 'license.txt',                               size: '라이선스 문서 · 12 KB' },
              ].map(({ icon, name, size }) => (
                <div key={name} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <div className="w-9 h-9 rounded-lg bg-lime/[0.08] border border-lime/15 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{name}</p>
                    <p className="text-[11px] text-sand/30">{size}</p>
                  </div>
                  <button className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity cursor-pointer">
                    ↓ 다운로드
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-lime w-full justify-center py-3.5 rounded-xl">
              ⬇ 전체 파일 한번에 받기
            </button>
            <p className="text-[12px] text-sand/25 mt-3 flex items-center gap-1.5">
              🕐 다운로드 링크는 <strong className="text-sand/40">72시간</strong> 유효 · 이후 구매 내역에서 재발급 가능
            </p>
          </div>

          {/* 다음 단계 */}
          <h2 className="font-syne font-bold text-[13px] text-sand/35 uppercase tracking-wider mb-3">다음 단계</h2>
          <div className="space-y-2.5">
            {[
              { icon: '⌨', title: '프로젝트 설치하기',   desc: 'npm install → npm run dev로 바로 시작', href: '#' },
              { icon: '🚀', title: 'Vercel에 배포하기',   desc: 'GitHub 연결 후 원클릭 배포 — 5분이면 라이브', href: '#' },
              { icon: '🎨', title: '커스터마이징 가이드',  desc: '색상, 폰트, 텍스트 변경 방법 확인', href: '#' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card-base rounded-xl p-4 flex items-start gap-3.5 hover:border-white/18 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-lime/[0.08] flex items-center justify-center flex-shrink-0 text-base">{icon}</div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium mb-0.5">{title}</p>
                  <p className="text-[12px] text-sand/40 font-light">{desc}</p>
                </div>
                <span className="text-sand/20 mt-1">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* 영수증 */}
        <div>
          <div className="bg-teal/[0.07] border border-teal/15 rounded-xl p-3.5 flex items-start gap-2.5 mb-4 text-[12px] text-teal/85 leading-relaxed">
            <span className="text-base flex-shrink-0">📧</span>
            <span><strong className="text-teal">{email}</strong>으로 다운로드 링크와 영수증을 보내드렸어요.</span>
          </div>

          <div className="card-base rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.07]">
              <span className="font-syne font-bold text-[14px]">결제 영수증</span>
              <button className="text-[11px] text-sand/40 border border-white/10 rounded-md px-2.5 py-1 hover:text-sand transition-colors cursor-pointer">
                복사
              </button>
            </div>
            <div className="space-y-2.5 text-[13px]">
              {[
                { k: '상품',    v: template?.name?.slice(0, 18) + '...' ?? 'Lumina SaaS Kit' },
                { k: '결제일',  v: formatDate(new Date().toISOString()) },
                { k: '결제수단',v: '신용카드 ****8821' },
                { k: '정가',    v: formatPrice(template?.original_price ?? 49000) },
                { k: '할인',    v: `-${formatPrice((template?.original_price ?? 49000) - (template?.price ?? 29000))}` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between">
                  <span className="text-sand/40">{k}</span>
                  <span className={k === '할인' ? 'text-teal' : ''}>{v}</span>
                </div>
              ))}
              <div className="h-px bg-white/[0.07] my-1" />
              <div className="flex justify-between">
                <span className="font-medium">결제 금액</span>
                <span className="font-syne font-bold text-[17px] text-lime">
                  {formatPrice(template?.price ?? 29000)}
                </span>
              </div>
            </div>
          </div>

          {/* 추천 */}
          <h2 className="font-syne font-bold text-[13px] text-sand/35 uppercase tracking-wider mb-3">함께 많이 구매해요</h2>
          <div className="space-y-2">
            {[
              { name: 'Verdant SaaS Kit', price: 35000, bg: 'from-[#0d1b2a] to-[#1b4332]', slug: 'verdant-saas' },
              { name: 'Nova Portfolio',   price: 25000, bg: 'from-[#2d1b69] to-[#11998e]', slug: 'nova-portfolio' },
            ].map(({ name, price, bg, slug }) => (
              <Link key={slug} href={`/templates/${slug}`}
                className="card-base rounded-xl p-3 flex items-center gap-2.5 hover:border-white/18 transition-colors">
                <div className={`w-9 h-7 rounded-md bg-gradient-to-br ${bg} flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-[12px] font-medium">{name}</p>
                  <p className="text-[11px] text-lime">{formatPrice(price)}</p>
                </div>
                <span className="text-sand/20 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
