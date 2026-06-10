import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM ?? 'pixelkits <no-reply@pixelkits.co>'

// ── 구매 완료 이메일 ─────────────────────────────────────
interface SendPurchaseEmailParams {
  to:             string
  orderNumber:    string
  templateName:   string
  amount:         number
  downloadToken:  string
  tokenExpiresAt: string
}

export async function sendPurchaseEmail(params: SendPurchaseEmailParams) {
  const { to, orderNumber, templateName, amount, downloadToken, tokenExpiresAt } = params

  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download?token=${downloadToken}&type=all`
  const expiresKST  = new Date(tokenExpiresAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `[pixelkits] 구매 완료 — ${templateName}`,
    html: purchaseEmailHtml({ orderNumber, templateName, amount, downloadUrl, expiresKST }),
  })

  if (error) { console.error('[Email] 발송 실패:', error); return { success: false, error } }
  console.log('[Email] 발송 완료:', to, data?.id)
  return { success: true, id: data?.id }
}

// ── 뉴스레터 발송 ────────────────────────────────────────
interface SendNewsletterParams {
  subject:    string
  title:      string
  body:       string       // HTML 허용
  ctaText?:   string
  ctaUrl?:    string
  recipients: string[]     // 이메일 배열 (최대 50개씩 배치 처리)
}

export async function sendNewsletter(params: SendNewsletterParams) {
  const { subject, title, body, ctaText, ctaUrl, recipients } = params

  if (recipients.length === 0) return { success: true, sent: 0, failed: 0 }

  let sent   = 0
  let failed = 0

  // ── 1명씩 개별 발송 (Resend 제한 우회 + 실패 추적) ──
  for (const to of recipients) {
    try {
      const { error } = await resend.emails.send({
        from:    FROM,
        to:      [to],
        subject,
        html:    newsletterHtml({ title, body, ctaText, ctaUrl }),
      })

      if (error) {
        console.error(`[Newsletter] 발송 실패 (${to}):`, error)
        failed++
      } else {
        sent++
      }
    } catch (err) {
      console.error(`[Newsletter] 예외 (${to}):`, err)
      failed++
    }

    // Rate limit 방지 — 발송 간 100ms 딜레이
    await delay(100)
  }

  console.log(`[Newsletter] 완료: ${sent}명 성공, ${failed}명 실패 / 전체 ${recipients.length}명`)
  return { success: failed === 0, sent, failed }
}

// ── 주간 매출 리포트 이메일 ──────────────────────────────
interface WeeklyReportParams {
  to:              string
  weekLabel:       string  // 예: "2026년 6월 1주"
  weekRevenue:     number
  weekOrders:      number
  monthRevenue:    number
  monthOrders:     number
  topTemplates:    { name: string; count: number }[]
}

export async function sendWeeklyReport(params: WeeklyReportParams) {
  const { to, weekLabel, weekRevenue, weekOrders, monthRevenue, monthOrders, topTemplates } = params

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: `[pixelkits] 주간 매출 리포트 — ${weekLabel}`,
    html:    weeklyReportHtml({ weekLabel, weekRevenue, weekOrders, monthRevenue, monthOrders, topTemplates }),
  })

  if (error) { console.error('[WeeklyReport] 발송 실패:', error); return { success: false } }
  return { success: true }
}

// ── 딜레이 유틸 ──────────────────────────────────────────
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

// ────────────────────────────────────────────────────────
// HTML 템플릿 함수들
// ────────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
</head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8e4d8">
<div style="max-width:560px;margin:0 auto;padding:48px 24px">
<div style="margin-bottom:32px">
  <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">pixelkits<span style="color:#c6f135">.</span></span>
</div>
${content}
<div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)">
  <p style="margin:0;font-size:11px;color:rgba(232,228,216,0.2)">
    © ${new Date().getFullYear()} pixelkits · <a href="${process.env.NEXT_PUBLIC_SITE_URL}/settings" style="color:rgba(198,241,53,0.5);text-decoration:none">수신 거부</a>
  </p>
</div>
</div></body></html>`
}

function purchaseEmailHtml({ orderNumber, templateName, amount, downloadUrl, expiresKST }: {
  orderNumber: string; templateName: string; amount: number; downloadUrl: string; expiresKST: string
}) {
  return baseHtml(`
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:20px">
  <div style="width:48px;height:48px;background:rgba(198,241,53,0.1);border:1px solid rgba(198,241,53,0.2);border-radius:12px;font-size:24px;display:flex;align-items:center;justify-content:center;margin-bottom:20px">✓</div>
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">결제 완료!</h1>
  <p style="margin:0;color:rgba(232,228,216,0.5);font-size:14px">주문번호 <strong style="color:rgba(232,228,216,0.8)">${orderNumber}</strong></p>
</div>
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px">
  <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700">구매 상품</p>
  <p style="margin:0 0 12px;font-size:16px;font-weight:700">${templateName}</p>
  <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;justify-content:space-between">
    <span style="font-size:13px;color:rgba(232,228,216,0.5)">결제 금액</span>
    <strong style="font-size:15px;color:#c6f135">${amount === 0 ? '무료' : `₩${amount.toLocaleString()}`}</strong>
  </div>
</div>
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px">
  <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700">다운로드</p>
  <p style="margin:0 0 16px;font-size:13px;color:rgba(232,228,216,0.5)">링크는 <strong style="color:rgba(232,228,216,0.7)">${expiresKST}</strong>까지 유효해요.</p>
  <a href="${downloadUrl}" style="display:inline-block;background:#c6f135;color:#0a0a0a;font-weight:800;font-size:14px;padding:14px 28px;border-radius:100px;text-decoration:none">다운로드 하기 →</a>
</div>
<p style="font-size:12px;color:rgba(232,228,216,0.3);line-height:1.7">
  • 링크 만료 시 <a href="${process.env.NEXT_PUBLIC_SITE_URL}/downloads" style="color:rgba(198,241,53,0.7);text-decoration:none">다운로드 페이지</a>에서 재발급하세요.<br>
  • 7일 환불 보장. 문의: <a href="mailto:support@pixelkits.co" style="color:rgba(198,241,53,0.7);text-decoration:none">support@pixelkits.co</a>
</p>
`)
}

function newsletterHtml({ title, body, ctaText, ctaUrl }: {
  title: string; body: string; ctaText?: string; ctaUrl?: string
}) {
  return baseHtml(`
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:20px">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;line-height:1.3">${title}</h1>
  <div style="font-size:14px;color:rgba(232,228,216,0.65);line-height:1.8">${body}</div>
  ${ctaText && ctaUrl ? `
  <div style="margin-top:28px">
    <a href="${ctaUrl}" style="display:inline-block;background:#c6f135;color:#0a0a0a;font-weight:800;font-size:14px;padding:14px 28px;border-radius:100px;text-decoration:none">${ctaText}</a>
  </div>` : ''}
</div>
`)
}

function weeklyReportHtml({ weekLabel, weekRevenue, weekOrders, monthRevenue, monthOrders, topTemplates }: {
  weekLabel: string; weekRevenue: number; weekOrders: number
  monthRevenue: number; monthOrders: number
  topTemplates: { name: string; count: number }[]
}) {
  const topList = topTemplates.map((t, i) =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <span style="font-size:13px;color:rgba(232,228,216,0.7)">${i + 1}. ${t.name}</span>
      <span style="font-size:13px;color:#c6f135;font-weight:700">${t.count}건</span>
    </div>`
  ).join('')

  return baseHtml(`
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:16px">
  <p style="margin:0 0 8px;font-size:12px;color:rgba(232,228,216,0.3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700">주간 리포트</p>
  <h1 style="margin:0;font-size:22px;font-weight:800">${weekLabel}</h1>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px">
    <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3)">이번 주 매출</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#c6f135">₩${weekRevenue.toLocaleString()}</p>
    <p style="margin:4px 0 0;font-size:12px;color:rgba(232,228,216,0.3)">${weekOrders}건</p>
  </div>
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px">
    <p style="margin:0 0 4px;font-size:11px;color:rgba(232,228,216,0.3)">이번 달 누계</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#e8e4d8">₩${monthRevenue.toLocaleString()}</p>
    <p style="margin:4px 0 0;font-size:12px;color:rgba(232,228,216,0.3)">${monthOrders}건</p>
  </div>
</div>
${topTemplates.length > 0 ? `
<div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:16px">
  <p style="margin:0 0 12px;font-size:13px;font-weight:700">이번 주 인기 템플릿</p>
  ${topList}
</div>` : ''}
<div style="text-align:center;margin-top:24px">
  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" style="display:inline-block;background:rgba(198,241,53,0.1);border:1px solid rgba(198,241,53,0.2);color:#c6f135;font-size:13px;padding:12px 24px;border-radius:100px;text-decoration:none">어드민 대시보드 보기 →</a>
</div>
`)
}