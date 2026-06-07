import Link from 'next/link'

export const metadata = {
  title: '이용약관 — pixelkits',
  description: 'pixelkits 서비스 이용약관',
}

const UPDATED = '2026년 1월 1일'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      <div className="mb-12">
        <p className="text-[12px] text-sand/30 uppercase tracking-widest font-syne font-bold mb-3">Legal</p>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-3">이용약관</h1>
        <p className="text-[14px] text-sand/40">최종 업데이트: {UPDATED}</p>
      </div>

      <div className="space-y-10 text-[14px] text-sand/70 leading-[1.85]">

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제1조 (목적)</h2>
          <p>
            이 약관은 pixelkits(이하 "회사")가 운영하는 픽셀키츠(pixelkits.co, 이하 "서비스")의
            이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제2조 (정의)</h2>
          <ul className="space-y-2 list-none">
            {[
              ['서비스', '회사가 제공하는 프론트엔드 템플릿 판매 플랫폼 및 이와 관련된 제반 서비스'],
              ['이용자', '서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원'],
              ['회원', '회사에 개인정보를 제공하여 회원가입을 한 자로, 서비스를 계속 이용할 수 있는 자'],
              ['템플릿', '회사 또는 크리에이터가 서비스를 통해 판매하는 프론트엔드 소스코드 및 관련 파일 일체'],
              ['콘텐츠', '서비스 내에서 이용자가 이용할 수 있는 텍스트, 이미지, 영상, 소스코드 등 모든 정보'],
            ].map(([term, def]) => (
              <li key={term} className="flex gap-3">
                <span className="text-lime flex-shrink-0">"{term}"</span>
                <span>이란 {def}를 말합니다.</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제3조 (약관의 효력 및 변경)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
            <li>약관이 변경되는 경우 회사는 변경 사항을 시행일 7일 전부터 공지합니다. 다만, 이용자에게 불리한 약관의 변경은 30일 전에 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 이용 계약을 해지할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제4조 (회원가입)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 이 약관에 동의함으로써 회원가입을 신청합니다.</li>
            <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</li>
            <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 경우는 예외로 합니다.</li>
            <li>허위의 정보를 기재하거나 회사가 제시하는 내용을 기재하지 않은 경우 가입이 거부될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제5조 (서비스의 제공 및 변경)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>회사는 다음과 같은 업무를 수행합니다.
              <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-sand/55">
                <li>프론트엔드 템플릿 소스코드 판매</li>
                <li>템플릿 라이선스 발급</li>
                <li>설치 가이드 및 기술 문서 제공</li>
                <li>고객 지원 서비스</li>
              </ul>
            </li>
            <li>회사는 서비스의 내용을 변경할 경우 이용자에게 사전 공지합니다.</li>
            <li>회사는 서비스의 안정적 운영을 위해 정기점검을 실시할 수 있으며, 이로 인한 서비스 중단에 대해 미리 공지합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제6조 (라이선스 및 지적재산권)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>이용자가 구매한 템플릿에 대해 회사는 다음과 같은 라이선스를 부여합니다.
              <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-sand/55">
                <li>개인 및 상업 프로젝트에서의 사용 허용</li>
                <li>클라이언트 납품 목적의 수정 및 사용 허용</li>
                <li>구매한 템플릿 기반의 파생 작업물 제작 허용</li>
              </ul>
            </li>
            <li>다음 행위는 엄격히 금지됩니다.
              <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-sand/55">
                <li>구매한 템플릿의 재판매 또는 무단 배포</li>
                <li>구매한 템플릿을 마켓플레이스에 업로드하는 행위</li>
                <li>저작권자 표시 제거 (소스코드 내 라이선스 헤더)</li>
              </ul>
            </li>
            <li>서비스에 게재된 모든 콘텐츠의 저작권은 회사에 귀속됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제7조 (결제 및 환불)</h2>
          <p className="mb-3">결제 및 환불에 관한 상세 정책은 <Link href="/refund" className="text-lime hover:opacity-75 transition-opacity">환불 정책</Link> 페이지를 참고해주세요.</p>
          <ol className="space-y-2 list-decimal list-inside">
            <li>서비스 이용 요금은 각 템플릿 상세 페이지에 표시된 금액으로 하며 부가세가 포함된 금액입니다.</li>
            <li>결제는 토스페이먼츠를 통해 처리되며 신용카드, 토스페이, 카카오페이를 지원합니다.</li>
            <li>디지털 콘텐츠 특성상, 구매 후 다운로드가 완료된 경우 환불이 제한될 수 있습니다.</li>
            <li>단, 구매 후 7일 이내 미다운로드 또는 기술적 결함이 확인된 경우 전액 환불이 가능합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제8조 (이용자의 의무)</h2>
          <p className="mb-3">이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="space-y-2 list-disc list-inside">
            {[
              '타인의 정보 도용',
              '회사가 게시한 정보의 변경',
              '회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시',
              '회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해',
              '회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위',
              '외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위',
              '기타 불법적이거나 부당한 행위',
            ].map((item) => (
              <li key={item} className="text-sand/60">{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제9조 (면책조항)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
            <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
            <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.</li>
            <li>구매한 템플릿을 이용자의 프로젝트에 적용함으로 인해 발생하는 모든 문제에 대한 책임은 이용자에게 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[17px] text-sand mb-4">제10조 (분쟁해결)</h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>서비스 이용과 관련하여 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
            <li>회사와 이용자 간에 제기된 소송에는 대한민국법을 적용합니다.</li>
          </ol>
        </section>

        <div className="border-t border-white/[0.07] pt-8 mt-8">
          <p className="text-[13px] text-sand/35 mb-2">문의사항이 있으신 경우 아래로 연락해주세요.</p>
          <a href="mailto:support@pixelkits.co"
            className="text-lime hover:opacity-75 transition-opacity text-[14px]">
            support@pixelkits.co
          </a>
        </div>

      </div>
    </div>
  )
}