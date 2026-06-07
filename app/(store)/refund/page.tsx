import Link from 'next/link'

export const metadata = {
  title: '환불 정책 — pixelkits',
  description: 'pixelkits 환불 및 취소 정책',
}

const UPDATED = '2026년 1월 1일'

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      <div className="mb-12">
        <p className="text-[12px] text-sand/30 uppercase tracking-widest font-syne font-bold mb-3">Legal</p>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-3">환불 정책</h1>
        <p className="text-[14px] text-sand/40">최종 업데이트: {UPDATED}</p>
      </div>

      {/* 핵심 요약 카드 */}
      <div className="bg-teal/[0.07] border border-teal/20 rounded-2xl p-6 mb-12">
        <p className="font-syne font-bold text-[15px] text-teal mb-4">핵심 요약</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '↻', label: '7일 환불 보장', sub: '구매 후 7일 이내' },
            { icon: '⚡', label: '빠른 처리',    sub: '영업일 3일 이내' },
            { icon: '💳', label: '전액 환불',    sub: '원결제 수단으로' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="font-medium text-sand text-[13px]">{label}</p>
              <p className="text-[12px] text-sand/40 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-10 text-[14px] text-sand/70 leading-[1.85]">

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">환불 가능 조건</h2>
          <p className="mb-4">다음 조건을 모두 충족하는 경우 전액 환불이 가능합니다.</p>
          <div className="space-y-3">
            {[
              { ok: true,  text: '구매일로부터 7일 이내 환불 요청' },
              { ok: true,  text: '소스코드를 다운로드하지 않은 경우' },
              { ok: true,  text: '기술적 결함이 확인된 경우 (다운로드 여부 무관)' },
              { ok: true,  text: '상품 설명과 실제 내용이 현저히 다른 경우' },
            ].map(({ ok, text }) => (
              <div key={text}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                <span className={`text-[16px] flex-shrink-0 ${ok ? 'text-teal' : 'text-[#ff5f3f]'}`}>
                  {ok ? '✓' : '✗'}
                </span>
                <span className="text-[13px]">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">환불 불가 조건</h2>
          <div className="space-y-3">
            {[
              { ok: false, text: '구매일로부터 7일이 경과한 경우' },
              { ok: false, text: '소스코드를 이미 다운로드한 경우 (기술적 결함 제외)' },
              { ok: false, text: '단순 변심 (구매 후 다운로드 완료된 경우)' },
              { ok: false, text: '라이선스 약관을 위반하여 사용한 경우' },
            ].map(({ ok, text }) => (
              <div key={text}
                className="flex items-center gap-3 bg-[#ff5f3f]/[0.04] border border-[#ff5f3f]/10 rounded-xl px-4 py-3">
                <span className="text-[16px] flex-shrink-0 text-[#ff5f3f]">✗</span>
                <span className="text-[13px]">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">환불 신청 방법</h2>
          <div className="space-y-4">
            {[
              {
                step: '01',
                title: '이메일로 환불 요청',
                desc: 'support@pixelkits.co로 주문번호, 구매 이메일, 환불 사유를 포함해 이메일을 보내주세요.',
              },
              {
                step: '02',
                title: '확인 및 검토',
                desc: '영업일 1~2일 이내에 환불 가능 여부를 확인하고 답변을 드립니다.',
              },
              {
                step: '03',
                title: '환불 처리',
                desc: '환불이 승인되면 영업일 3일 이내에 결제하신 수단으로 전액 환불됩니다. 카드사 정책에 따라 실제 취소까지 3~5 영업일이 소요될 수 있습니다.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step}
                className="flex gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <span className="font-syne font-extrabold text-[22px] text-lime/30 flex-shrink-0 leading-none mt-0.5">
                  {step}
                </span>
                <div>
                  <p className="font-medium text-sand mb-1">{title}</p>
                  <p className="text-[13px] text-sand/55 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">기술적 결함 환불</h2>
          <p className="mb-3">
            구매한 템플릿이 다음과 같은 기술적 결함을 가진 경우, 다운로드 여부와 관계없이 환불 또는 대체 제품 제공이 가능합니다.
          </p>
          <ul className="space-y-2 list-disc list-inside text-sand/60">
            <li>소스코드가 설명과 다르게 동작하는 경우</li>
            <li>다운로드 파일이 손상되어 압축 해제가 불가능한 경우</li>
            <li>필수 파일이 누락된 경우</li>
            <li>설명된 기능이 실제로 존재하지 않는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">부분 환불</h2>
          <p>
            원칙적으로 부분 환불은 지원하지 않습니다. 패키지 상품의 경우 개별 항목에 대한 부분 환불도 지원하지 않으며,
            전체 환불 또는 유지 중 선택하시게 됩니다.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">자주 묻는 질문</h2>
          <div className="space-y-3">
            {[
              {
                q: '다운로드 링크를 클릭만 했는데 환불이 안 되나요?',
                a: '다운로드 링크를 클릭하여 파일이 실제로 저장된 경우 환불이 제한됩니다. 링크 클릭 후 다운로드를 시작하지 않은 경우는 고객센터로 문의해주세요.',
              },
              {
                q: '환불 후 라이선스는 어떻게 되나요?',
                a: '환불이 완료되면 해당 템플릿에 대한 라이선스는 즉시 만료됩니다. 환불 후 해당 소스코드를 계속 사용하는 경우 저작권법 위반이 될 수 있습니다.',
              },
              {
                q: '해외 카드로 결제했는데 환불은 어떻게 되나요?',
                a: '결제하신 카드로 동일 금액이 환불됩니다. 환율 차이로 인한 금액 차이는 회사가 책임지지 않습니다.',
              },
            ].map(({ q, a }) => (
              <div key={q}
                className="border border-white/[0.07] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                  <p className="font-medium text-sand text-[13px]">Q. {q}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[13px] text-sand/55 leading-relaxed">A. {a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <p className="font-syne font-bold text-[15px] mb-2">환불 문의</p>
          <p className="text-[13px] text-sand/50 mb-4 leading-relaxed">
            환불 관련 문의는 아래 이메일로 주문번호와 함께 연락해주세요.<br />
            영업일 기준 24시간 이내에 답변드립니다.
          </p>
          <a href="mailto:support@pixelkits.co"
            className="inline-flex items-center gap-2 bg-lime text-ink font-syne font-bold
                       text-[13px] rounded-full px-5 py-2.5 hover:opacity-85 transition-opacity">
            support@pixelkits.co로 문의하기 →
          </a>
        </div>

        <div className="border-t border-white/[0.07] pt-8 flex gap-4 text-[13px]">
          <Link href="/terms" className="text-lime/70 hover:text-lime transition-colors">이용약관</Link>
          <span className="text-sand/20">·</span>
          <Link href="/privacy" className="text-lime/70 hover:text-lime transition-colors">개인정보처리방침</Link>
        </div>

      </div>
    </div>
  )
}