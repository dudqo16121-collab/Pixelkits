'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const AUDIENCE_OPTIONS = [
  { v: 'newsletter', l: '뉴스레터 구독자',  sub: '알림 설정에서 뉴스레터 동의한 유저' },
  { v: 'purchasers', l: '구매자 전체',       sub: '완료된 주문이 있는 모든 유저'       },
  { v: 'all',        l: '전체 (구독자+구매자)', sub: '중복 제거 후 모두 포함'           },
] as const

type Audience = 'newsletter' | 'purchasers' | 'all'

export default function AdminNewsletterPage() {
  const [subject,   setSubject]   = useState('')
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [ctaText,   setCtaText]   = useState('')
  const [ctaUrl,    setCtaUrl]    = useState('')
  const [audience,  setAudience]  = useState<Audience>('newsletter')
  const [sending,   setSending]   = useState(false)
  const [result,    setResult]    = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [error,     setError]     = useState('')
  const [preview,   setPreview]   = useState(false)

  async function handleSend() {
    if (!subject || !title || !body) { setError('제목, 타이틀, 본문은 필수예요'); return }
    if (!confirm(`${audience === 'newsletter' ? '뉴스레터 구독자' : audience === 'purchasers' ? '구매자 전체' : '전체'}에게 발송할까요? 취소할 수 없어요.`)) return

    setSending(true)
    setError('')
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/newsletter', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ subject, title, body, ctaText, ctaUrl, audience }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '발송에 실패했어요'); return }
      setResult({ sent: data.sent, failed: data.failed, total: data.total })
    } finally {
      setSending(false)
    }
  }

  const inputCls = `w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                   text-[14px] text-sand placeholder:text-sand/20
                   outline-none focus:border-lime/40 transition-colors`

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">뉴스레터 발송</h1>
        <p className="text-[14px] text-sand/40">Resend를 통해 이메일을 일괄 발송해요</p>
      </div>

      {/* 발송 결과 */}
      {result && (
        <div className="bg-teal/[0.08] border border-teal/20 rounded-2xl p-5 mb-6">
          <p className="font-syne font-bold text-[15px] text-teal mb-1">✓ 발송 완료</p>
          <p className="text-[13px] text-sand/60">
            전체 {result.total}명 중 <strong className="text-teal">{result.sent}명</strong> 성공
            {result.failed > 0 && <span className="text-[#ff5f3f] ml-2">{result.failed}명 실패</span>}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[#ff5f3f]/10 border border-[#ff5f3f]/20 rounded-2xl p-4 mb-6 text-[13px] text-[#ff5f3f]">
          {error}
        </div>
      )}

      <div className="space-y-5">

        {/* 수신자 */}
        <div>
          <p className="text-[12px] text-sand/45 mb-2 font-medium">수신자 *</p>
          <div className="space-y-2">
            {AUDIENCE_OPTIONS.map(({ v, l, sub }) => (
              <button key={v} onClick={() => setAudience(v)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer
                  ${audience === v
                    ? 'border-lime/40 bg-lime/[0.06]'
                    : 'border-white/10 hover:border-white/20'}`}>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all
                  ${audience === v ? 'border-lime bg-lime' : 'border-white/20'}`} />
                <div>
                  <p className={`text-[13px] font-medium ${audience === v ? 'text-lime' : 'text-sand'}`}>{l}</p>
                  <p className="text-[12px] text-sand/35 mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 이메일 제목 */}
        <div>
          <label className="text-[12px] text-sand/45 mb-1.5 block font-medium">이메일 제목 *</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="[pixelkits] 새 템플릿이 출시됐어요 🎉"
            className={inputCls} />
        </div>

        {/* 뉴스레터 타이틀 */}
        <div>
          <label className="text-[12px] text-sand/45 mb-1.5 block font-medium">뉴스레터 타이틀 *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="새 SaaS 템플릿 출시!"
            className={inputCls} />
        </div>

        {/* 본문 */}
        <div>
          <label className="text-[12px] text-sand/45 mb-1.5 block font-medium">
            본문 * <span className="text-sand/25 font-normal">(HTML 허용)</span>
          </label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="이번 달 새로운 SaaS 대시보드 템플릿이 출시됐어요.&#10;&#10;깔끔한 UI와 Next.js 14 App Router로 구성되어 있으며..."
            className={inputCls + ' resize-none'} />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] text-sand/45 mb-1.5 block font-medium">CTA 버튼 텍스트</label>
            <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
              placeholder="템플릿 보러가기"
              className={inputCls} />
          </div>
          <div>
            <label className="text-[12px] text-sand/45 mb-1.5 block font-medium">CTA URL</label>
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://pixelkits.co/templates"
              className={inputCls} />
          </div>
        </div>

        {/* 미리보기 토글 */}
        {body && (
          <div>
            <button onClick={() => setPreview(!preview)}
              className="text-[13px] text-lime/70 hover:text-lime transition-colors cursor-pointer">
              {preview ? '미리보기 닫기 ↑' : '이메일 미리보기 ↓'}
            </button>
            {preview && (
              <div className="mt-3 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-[#111] px-4 py-2 text-[11px] text-sand/30 border-b border-white/[0.07]">
                  제목: {subject || '(없음)'}
                </div>
                <iframe
                  srcDoc={`<html><body style="margin:0;padding:0;background:#0a0a0a;color:#e8e4d8;font-family:sans-serif">
                    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
                      <h1 style="font-size:20px;font-weight:800;margin:0 0 16px">${title}</h1>
                      <div style="font-size:14px;color:rgba(232,228,216,0.65);line-height:1.8">${body.replace(/\n/g, '<br>')}</div>
                      ${ctaText ? `<div style="margin-top:24px"><a href="${ctaUrl}" style="background:#c6f135;color:#0a0a0a;font-weight:800;padding:12px 24px;border-radius:100px;text-decoration:none;display:inline-block">${ctaText}</a></div>` : ''}
                    </div>
                  </body></html>`}
                  className="w-full h-72 bg-[#0a0a0a]"
                  title="이메일 미리보기"
                />
              </div>
            )}
          </div>
        )}

        {/* 발송 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSend}
            disabled={sending || !subject || !title || !body}
            className="btn-lime px-8 py-3 text-[14px] disabled:opacity-40">
            {sending ? '발송 중...' : '📧 뉴스레터 발송'}
          </button>
          <button
            onClick={() => { setSubject(''); setTitle(''); setBody(''); setCtaText(''); setCtaUrl(''); setResult(null); setError('') }}
            className="border border-white/10 rounded-xl px-5 py-3 text-[13px] text-sand/50
                       hover:text-sand hover:border-white/25 transition-colors cursor-pointer">
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}