'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTemplateBySlug } from '@/lib/templates'
import { formatPrice } from '@/lib/utils'
import type { Template } from '@/types'

type PayMethod = 'card' | 'tosspay' | 'kakaopay'

export default function CheckoutPage() {
  const params = useSearchParams()
  const router = useRouter()
  const slug   = params.get('template') ?? ''

  const [template,  setTemplate]  = useState<Template | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [email,     setEmail]     = useState('')
  const [method,    setMethod]    = useState<PayMethod>('card')
  const [promo,     setPromo]     = useState('')
  const [discount,  setDiscount]  = useState(0)
  const [agreed,    setAgreed]    = useState(true)
  const [paying,    setPaying]    = useState(false)
  const [promoMsg,  setPromoMsg]  = useState('')

  useEffect(() => {
    if (!slug) return
    getTemplateBySlug(slug).then((t) => {
      setTemplate(t)
      setLoading(false)
    })
  }, [slug])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-sand/30">
      <div className="w-6 h-6 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-3" />
      불러오는 중...
    </div>
  )

  if (!template) return (
    <div className="flex items-center justify-center min-h-[60vh] text-sand/40">
      템플릿을 찾을 수 없어요.{' '}
      <Link href="/templates" className="text-lime ml-1">목록으로</Link>
    </div>
  )

  const basePrice  = template.price ?? 0
  const origPrice  = template.original_price ?? basePrice
  const finalPrice = Math.max(0, basePrice - discount)
  const discountPct = origPrice > 0
    ? Math.round((1 - basePrice / origPrice) * 100)
    : 0

  function applyPromo() {
    if (promo.toUpperCase() === 'WELCOME10') {
      const disc = Math.round(basePrice * 0.1)
      setDiscount(disc)
      setPromoMsg(`WELCOME10 적용 — ${formatPrice(disc)} 할인!`)
    } else {
      setPromoMsg('유효하지 않은 코드입니다')
      setTimeout(() => setPromoMsg(''), 2000)
    }
  }

  async function handlePay() {
    if (!email || !agreed) return
    setPaying(true)
    // 실제 구현 시 → 토스페이먼츠 SDK 호출
    await new Promise((r) => setTimeout(r, 1000))
    router.push(`/checkout/success?template=${slug}&email=${encodeURIComponent(email)}`)
  }

  const METHODS: { id: PayMethod; label: string; sub: string }[] = [
    { id: 'card',     label: '신용 · 체크카드', sub: '국내외 모든 카드' },
    { id: 'tosspay',  label: '토스페이',        sub: '간편결제' },
    { id: 'kakaopay', label: '카카오페이',       sub: '간편결제' },
  ]

  return (
    <div className="grid md:grid-cols-[1fr_360px] min-h-[calc(100vh-57px)]">
      {/* ── 왼쪽: 결제 폼 ── */}
      <div className="p-8 md:px-12 border-r border-white/[0.07]">
        {/* 진행 단계 */}
        <div className="flex items-center gap-2 mb-10 text-[13px]">
          {['상품 선택','결제 정보','다운로드'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <span className="w-8 h-px bg-white/10" />}
              <div className={`flex items-center gap-2 ${i === 1 ? '' : 'opacity-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center
                                  text-[11px] font-bold flex-shrink-0
                  ${i === 0 ? 'bg-teal text-[#04342c]'
                    : i === 1 ? 'bg-lime text-ink'
                    : 'bg-white/[0.08] text-sand/40'}`}>
                  {i === 0 ? '✓' : i + 1}
                </span>
                <span className={i <= 1 ? 'text-sand font-medium' : 'text-sand/30'}>{step}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 이메일 */}
        <h2 className="font-syne font-bold text-[17px] mb-4">이메일 주소</h2>
        <div className="mb-2">
          <label className="text-[12px] text-sand/45 mb-1.5 block">
            결제 완료 후 다운로드 링크를 보내드려요
          </label>
          <input type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            className="w-full bg-panel border border-white/10 rounded-xl px-4 py-3 text-[14px]
                       text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
        </div>
        <p className="text-[12px] text-sand/30 mb-7">스팸 없음 · 다운로드 링크 + 영수증만 발송됩니다</p>

        <div className="h-px bg-white/[0.07] mb-7" />

        {/* 결제 수단 */}
        <h2 className="font-syne font-bold text-[17px] mb-4">결제 수단</h2>
        <div className="flex gap-2.5 mb-7">
          {METHODS.map(({ id, label, sub }) => (
            <button key={id} onClick={() => setMethod(id)}
              className={`flex-1 card-base rounded-xl p-3.5 flex items-center gap-2.5 transition-all cursor-pointer
                ${method === id ? 'border-lime/40 bg-lime/[0.05]' : 'hover:border-white/20'}`}>
              <div>
                <p className="text-[13px] font-medium text-left">{label}</p>
                <p className="text-[11px] text-sand/35 text-left">{sub}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border ml-auto flex-shrink-0 flex items-center justify-center
                ${method === id ? 'border-lime' : 'border-white/20'}`}>
                {method === id && <div className="w-2 h-2 rounded-full bg-lime" />}
              </div>
            </button>
          ))}
        </div>

        {/* 카드 폼 */}
        {method === 'card' && (
          <div className="space-y-3 mb-7">
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">카드 번호</label>
              <input placeholder="0000  0000  0000  0000"
                className="w-full bg-panel border border-white/10 rounded-xl px-4 py-3 text-[14px]
                           text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors tracking-widest" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-sand/45 mb-1.5 block">유효기간</label>
                <input placeholder="MM / YY"
                  className="w-full bg-panel border border-white/10 rounded-xl px-4 py-3 text-[14px]
                             text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
              </div>
              <div>
                <label className="text-[12px] text-sand/45 mb-1.5 block">CVC</label>
                <input placeholder="000"
                  className="w-full bg-panel border border-white/10 rounded-xl px-4 py-3 text-[14px]
                             text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* 약관 동의 */}
        <div className="flex items-start gap-2.5">
          <button onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer
              ${agreed ? 'bg-lime border-lime' : 'bg-transparent border-white/15'}`}>
            {agreed && <span className="text-ink text-[11px] font-bold">✓</span>}
          </button>
          <p className="text-[12px] text-sand/40 leading-relaxed">
            <span className="text-lime cursor-pointer hover:underline">이용약관</span> 및{' '}
            <span className="text-lime cursor-pointer hover:underline">개인정보처리방침</span>에 동의하며,
            디지털 상품 특성상 다운로드 후 환불이 제한될 수 있음을 확인합니다.
          </p>
        </div>
      </div>

      {/* ── 오른쪽: 주문 요약 ── */}
      <div className="p-7 bg-[#0d0d0d]">
        <h2 className="font-syne font-bold text-[15px] text-sand/40 uppercase tracking-wider mb-5">
          주문 요약
        </h2>

        {/* 상품 */}
        <div className="card-base rounded-xl p-4 flex items-start gap-3.5 mb-4">
          {template.thumbnail_url ? (
            <img src={template.thumbnail_url} alt={template.name}
              className="w-14 h-11 rounded-lg object-cover flex-shrink-0 border border-white/10" />
          ) : (
            <div className="w-14 h-11 rounded-lg bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                            flex-shrink-0 border border-white/10" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium truncate">{template.name}</p>
            <p className="text-[12px] text-sand/35 mt-0.5">
              {template.stack?.join(' · ')} · 평생 업데이트
            </p>
          </div>
          <span className="font-syne font-bold text-[15px] text-lime flex-shrink-0">
            {formatPrice(origPrice)}
          </span>
        </div>

        {/* 프로모 코드 */}
        <div className="flex gap-2 mb-5">
          <input value={promo} onChange={(e) => setPromo(e.target.value)}
            placeholder="할인 코드 입력"
            className="flex-1 bg-panel border border-white/10 rounded-xl px-4 py-3 text-[13px]
                       text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
          <button onClick={applyPromo}
            className="bg-white/[0.06] border border-white/10 rounded-xl px-4 text-[13px]
                       text-sand/60 hover:text-sand transition-colors cursor-pointer">
            적용
          </button>
        </div>
        {promoMsg && (
          <p className={`text-[12px] mb-4 -mt-2 ${promoMsg.includes('적용') ? 'text-teal' : 'text-[#ff5f3f]'}`}>
            {promoMsg}
          </p>
        )}

        {/* 가격 분해 */}
        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between text-[13px]">
            <span className="text-sand/40">상품 금액</span>
            <span className="text-sand">{formatPrice(origPrice)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-sand/40">할인 (-{discountPct}%)</span>
              <span className="text-teal">-{formatPrice(origPrice - basePrice)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-sand/40">프로모 코드</span>
              <span className="text-teal">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span className="text-sand/40">부가세 (10%)</span>
            <span className="text-sand">포함</span>
          </div>
          <div className="h-px bg-white/[0.07] my-1" />
          <div className="flex justify-between">
            <span className="font-syne font-bold text-[15px]">최종 결제</span>
            <span className="font-syne font-extrabold text-[22px] text-lime">
              {formatPrice(finalPrice)}
            </span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <button onClick={handlePay}
          disabled={!email || !agreed || paying}
          className="btn-lime w-full justify-center text-[15px] py-4 rounded-2xl mb-3
                     disabled:opacity-40 disabled:cursor-not-allowed">
          {paying ? '처리 중...' : `🔒 ${formatPrice(finalPrice)} 결제하기`}
        </button>

        <div className="flex justify-center gap-4 text-[11px] text-sand/25 mb-5">
          <span>🛡 안전결제</span>
          <span>↻ 7일 환불</span>
          <span>⬇ 즉시 다운로드</span>
        </div>

        <div className="bg-teal/[0.07] border border-teal/15 rounded-xl p-3 text-[12px] text-teal/85 leading-relaxed">
          결제 후 <strong className="text-teal">즉시</strong> 다운로드 링크가 이메일로 발송됩니다.
          7일 이내 미사용 시 전액 환불 가능.
        </div>
      </div>
    </div>
  )
}