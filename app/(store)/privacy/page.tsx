import Link from 'next/link'

export const metadata = {
  title: '개인정보처리방침 — pixelkits',
  description: 'pixelkits 개인정보처리방침',
}

const UPDATED = '2026년 1월 1일'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      <div className="mb-12">
        <p className="text-[12px] text-sand/30 uppercase tracking-widest font-syne font-bold mb-3">Legal</p>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-3">개인정보처리방침</h1>
        <p className="text-[14px] text-sand/40">최종 업데이트: {UPDATED}</p>
      </div>

      <div className="space-y-10 text-[14px] text-sand/70 leading-[1.85]">

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">1. 수집하는 개인정보 항목</h2>
          <p className="mb-4">pixelkits는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
          <div className="space-y-4">
            {[
              {
                title: '회원가입 시',
                items: ['이메일 주소', '비밀번호 (암호화 저장)', '이름 (선택)'],
              },
              {
                title: '결제 시',
                items: ['이메일 주소', '결제 수단 정보 (토스페이먼츠를 통해 처리, pixelkits는 저장하지 않음)', '결제 금액 및 주문 내역'],
              },
              {
                title: '서비스 이용 시 자동 수집',
                items: ['접속 IP 주소', '쿠키', '접속 일시', '서비스 이용 기록'],
              },
            ].map(({ title, items }) => (
              <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="font-medium text-sand mb-2">{title}</p>
                <ul className="space-y-1 list-disc list-inside text-sand/55">
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">2. 개인정보의 수집 및 이용목적</h2>
          <ul className="space-y-2 list-disc list-inside">
            {[
              '회원 식별 및 서비스 제공',
              '구매한 템플릿 다운로드 링크 발송',
              '결제 처리 및 영수증 발송',
              '고객 문의 응대 및 분쟁 처리',
              '서비스 개선을 위한 통계 분석',
              '프로모션 및 이벤트 안내 (동의한 경우)',
            ].map((item) => (
              <li key={item} className="text-sand/60">{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">3. 개인정보의 보유 및 이용기간</h2>
          <div className="overflow-hidden border border-white/[0.08] rounded-xl">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="text-left px-4 py-3 font-medium text-sand/60">항목</th>
                  <th className="text-left px-4 py-3 font-medium text-sand/60">보유기간</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['회원 정보', '회원 탈퇴 시까지'],
                  ['결제 및 주문 정보', '5년 (전자상거래법)'],
                  ['접속 로그', '3개월'],
                  ['고객 문의 내역', '3년'],
                ].map(([item, period], i) => (
                  <tr key={item} className={i < 3 ? 'border-b border-white/[0.05]' : ''}>
                    <td className="px-4 py-3 text-sand/60">{item}</td>
                    <td className="px-4 py-3 text-sand/50">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">4. 개인정보의 제3자 제공</h2>
          <p className="mb-4">
            pixelkits는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
            다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li className="text-sand/60">이용자가 사전에 동의한 경우</li>
            <li className="text-sand/60">법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
          <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="font-medium text-sand mb-3">결제 처리 위탁</p>
            <div className="grid grid-cols-3 text-[12px] gap-2">
              <span className="text-sand/40">수탁업체</span>
              <span className="text-sand/40">위탁 업무</span>
              <span className="text-sand/40">보유기간</span>
              <span className="text-sand/70">토스페이먼츠</span>
              <span className="text-sand/60">결제 처리</span>
              <span className="text-sand/60">결제 완료 후 5년</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">5. 이용자의 권리</h2>
          <p className="mb-4">이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul className="space-y-2 list-disc list-inside">
            {[
              '개인정보 열람 요청',
              '오류 등이 있을 경우 정정 요청',
              '삭제 요청 (단, 법령에 의해 보존이 필요한 경우 제외)',
              '처리 정지 요청',
            ].map((item) => (
              <li key={item} className="text-sand/60">{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sand/55">
            위 권리 행사는 <a href="mailto:support@pixelkits.co" className="text-lime hover:opacity-75 transition-opacity">support@pixelkits.co</a>로 이메일 요청하시면 됩니다.
            요청 후 10일 이내에 처리 결과를 안내해드립니다.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">6. 쿠키 사용</h2>
          <p className="mb-3">
            pixelkits는 로그인 상태 유지 및 서비스 개선을 위해 쿠키를 사용합니다.
            브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 서비스 이용에 어려움이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">7. 개인정보 보호책임자</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-2 text-[13px]">
            <div className="flex gap-4">
              <span className="text-sand/40 w-24 flex-shrink-0">서비스명</span>
              <span className="text-sand/70">pixelkits</span>
            </div>
            <div className="flex gap-4">
              <span className="text-sand/40 w-24 flex-shrink-0">이메일</span>
              <a href="mailto:support@pixelkits.co" className="text-lime hover:opacity-75 transition-opacity">
                support@pixelkits.co
              </a>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.07] pt-8 mt-8 flex gap-4 text-[13px]">
          <Link href="/terms" className="text-lime/70 hover:text-lime transition-colors">이용약관</Link>
          <span className="text-sand/20">·</span>
          <Link href="/refund" className="text-lime/70 hover:text-lime transition-colors">환불 정책</Link>
        </div>

      </div>
    </div>
  )
}