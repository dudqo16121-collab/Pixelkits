import Link from 'next/link'

export default function AboutPage() {
  return (
    <div>
      {/* 히어로 */}
      <section className="text-center px-8 py-16 border-b border-white/[0.06]">
        <span className="badge-lime mb-5 inline-block">✦ 우리 이야기</span>
        <h1 className="font-syne font-extrabold text-[clamp(32px,5vw,52px)] leading-[1.08] tracking-tight mb-5">
          개발자가 만든<br />
          <span className="text-transparent [-webkit-text-stroke:1px_rgba(200,241,53,0.6)]">개발자를 위한</span>
          <br />템플릿 스토어
        </h1>
        <p className="text-[16px] text-sand/50 font-light max-w-xl mx-auto leading-relaxed mb-8">
          납품 마감에 쫓기며 처음부터 만들던 시간이 아까웠어요.
          그래서 직접 만들었습니다 — 바로 쓸 수 있는, 진짜 퀄리티의 프론트엔드 템플릿.
        </p>
        <div className="inline-flex bg-panel border border-white/[0.07] rounded-2xl">
          {[
            { n: '120+', l: '프리미엄 템플릿' },
            { n: '4,800+', l: '다운로드' },
            { n: '4.9★', l: '평균 평점' },
            { n: '2024', l: '시작한 해' },
          ].map(({ n, l }, i) => (
            <div key={l} className={`flex flex-col items-center px-7 py-5 ${i > 0 ? 'border-l border-white/[0.07]' : ''}`}>
              <span className="font-syne font-extrabold text-2xl text-lime">{n}</span>
              <span className="text-[12px] text-sand/35 mt-0.5">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 스토리 */}
      <section className="max-w-4xl mx-auto px-8 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-syne font-bold text-[11px] text-lime uppercase tracking-widest mb-3">왜 만들었나요</p>
          <h2 className="font-syne font-extrabold text-2xl tracking-tight mb-4 leading-tight">마감 전날 밤의 기억에서 시작됐어요</h2>
          <p className="text-[14px] text-sand/55 font-light leading-relaxed mb-3">
            프리랜서로 일하며 클라이언트 랜딩페이지를 매번 처음부터 만들었어요. 히어로 섹션, 가격표, 후기 — 반복되는 패턴인데 시간은 늘 부족했죠.
          </p>
          <p className="text-[14px] text-sand/55 font-light leading-relaxed">
            좋은 템플릿을 찾으면 영어 문서에 해외 결제, 막상 열어보면 코드가 엉망. 그래서 직접 만들기로 했습니다.
          </p>
        </div>
        <div className="card-base rounded-2xl p-5 space-y-3">
          {[
            { icon: '⌨', color: 'bg-lime/10 text-lime',   label: '깔끔한 컴포넌트 구조',  sub: '유지보수가 쉬운 코드' },
            { icon: '📖', color: 'bg-teal/10 text-teal',   label: '한국어 설치 가이드',     sub: '한국 개발자를 위한 문서' },
            { icon: '↻',  color: 'bg-blue-500/10 text-blue-400', label: '평생 무료 업데이트', sub: '한 번 사면 계속 최신' },
            { icon: '✦',  color: 'bg-lime/10 text-lime',   label: '상업적 사용 가능',       sub: '클라이언트 납품 OK' },
          ].map(({ icon, color, label, sub }) => (
            <div key={label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
              <div><p className="text-[13px]">{label}</p><p className="text-[11px] text-sand/30 mt-0.5">{sub}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* 원칙 */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] px-8 py-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-center font-syne font-bold text-[11px] text-sand/30 uppercase tracking-widest mb-2">우리가 중요하게 생각하는 것</p>
          <h2 className="font-syne font-extrabold text-2xl tracking-tight text-center mb-10">pixelkits의 6가지 원칙</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '⚡', col: 'bg-lime/10 text-lime',         title: '바로 쓸 수 있는 코드',       desc: '설치 후 5분 안에 실행 가능해야 합니다.' },
              { icon: '👁', col: 'bg-teal/10 text-teal',         title: '보는 순간 사고 싶은 디자인',  desc: '퀄리티 낮은 템플릿은 만들지 않습니다.' },
              { icon: '📱', col: 'bg-blue-500/10 text-blue-400', title: '완전한 반응형',              desc: '모바일, 태블릿, 데스크탑 모두 완벽하게.' },
              { icon: '❤', col: 'bg-pink-500/10 text-pink-400', title: '한국 개발자를 위한',          desc: '한국어 문서, 원화 결제, 국내 결제 연동.' },
              { icon: '↻', col: 'bg-amber-500/10 text-amber-400',title: '지속적인 업데이트',          desc: '라이브러리 버전이 올라가면 함께 업데이트.' },
              { icon: '🛡', col: 'bg-teal/10 text-teal',         title: '안심하고 사용',              desc: '7일 환불 보장, 상업적 라이선스, 명확한 약관.' },
            ].map(({ icon, col, title, desc }) => (
              <div key={title} className="card-base rounded-2xl p-5 hover:border-white/16 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 ${col}`}>{icon}</div>
                <p className="font-syne font-bold text-[14px] mb-2">{title}</p>
                <p className="text-[12px] text-sand/45 font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-8 my-14 card-base rounded-3xl p-12 flex flex-wrap items-center justify-between gap-6 border-lime/15 bg-lime/[0.02]">
        <div>
          <h2 className="font-syne font-extrabold text-2xl tracking-tight mb-2">이제 직접 써보세요</h2>
          <p className="text-[14px] text-sand/40 font-light">무료 템플릿으로 먼저 시작해도 좋아요.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/faq"       className="btn-ghost">❓ FAQ 보기</Link>
          <Link href="/templates" className="btn-lime">⬡ 템플릿 보러가기</Link>
        </div>
      </section>
    </div>
  )
}
