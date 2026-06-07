import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM ?? 'pixelkits <no-reply@pixelkits.co>'

interface SendPurchaseEmailParams {
  to:            string
  orderNumber:   string
  templateName:  string
  amount:        number
  downloadToken: string
  tokenExpiresAt: string
}

export async function sendPurchaseEmail(params: SendPurchaseEmailParams) {
  const { to, orderNumber, templateName, amount, downloadToken, tokenExpiresAt } = params

  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?token=${downloadToken}`
  const expiresKST  = new Date(tokenExpiresAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `[pixelkits] 구매 완료 — ${templateName}`,
    html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8e4d8">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px">

    <!-- 로고 -->
    <div style="margin-bottom:32px">
      <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">
        pixelkits<span style="color:#c6f135">.</span>
      </span>
    </div>

    <!-- 헤더 -->
    <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:20px">
      <div style="width:48px;height:48px;background:rgba(198,241,53,0.1);border:1px solid rgba(198,241,53,0.2);
                  border-radius:12px;display:flex;align-items:center;justify-content:center;
                  font-size:24px;margin-bottom:20px">✓</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-0.5px">결제 완료!</h1>
      <p style="margin:0;color:rgba(232,228,216,0.5);font-size:14px">
        주문번호 <strong style="color:rgba(232,228,216,0.8)">${orderNumber}</strong>
      </p>
    </div>

    <!-- 상품 정보 -->
    <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700">구매 상품</p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700">${templateName}</p>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;justify-content:space-between">
        <span style="font-size:13px;color:rgba(232,228,216,0.5)">결제 금액</span>
        <strong style="font-size:15px;color:#c6f135">₩${amount.toLocaleString()}</strong>
      </div>
    </div>

    <!-- 다운로드 버튼 -->
    <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700">다운로드</p>
      <p style="margin:0 0 16px;font-size:13px;color:rgba(232,228,216,0.5)">
        아래 버튼을 눌러 소스코드, 설치 가이드, 라이선스를 다운로드하세요.<br>
        링크는 <strong style="color:rgba(232,228,216,0.7)">${expiresKST}</strong>까지 유효해요.
      </p>
      <a href="${downloadUrl}"
         style="display:inline-block;background:#c6f135;color:#0a0a0a;font-weight:800;font-size:14px;
                padding:14px 28px;border-radius:100px;text-decoration:none;letter-spacing:-0.2px">
        다운로드 하기 →
      </a>
    </div>

    <!-- 안내 -->
    <div style="padding:0 4px">
      <p style="margin:0 0 8px;font-size:12px;color:rgba(232,228,216,0.3);line-height:1.7">
        • 링크가 만료됐다면 <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders" style="color:rgba(198,241,53,0.7);text-decoration:none">구매 내역</a>에서 재발급받을 수 있어요.<br>
        • 7일 이내 환불 정책이 적용됩니다. 문의: <a href="mailto:support@pixelkits.co" style="color:rgba(198,241,53,0.7);text-decoration:none">support@pixelkits.co</a>
      </p>
    </div>

    <!-- 푸터 -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)">
      <p style="margin:0;font-size:11px;color:rgba(232,228,216,0.2)">
        © ${new Date().getFullYear()} pixelkits. 이 메일은 구매 완료 후 자동 발송됩니다.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })

  if (error) {
    console.error('[Email] 발송 실패:', error)
    return { success: false, error }
  }

  console.log('[Email] 발송 완료:', to, data?.id)
  return { success: true, id: data?.id }
}