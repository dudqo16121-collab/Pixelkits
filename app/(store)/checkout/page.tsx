'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTemplateBySlug } from '@/lib/templates'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Template } from '@/types'

type PayMethod = 'card' | 'tosspay' | 'kakaopay'

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>
    }
  }
}

export default function CheckoutPage() {
  const params = useSearchParams()
  const router = useRouter()
  const slug   = params.get('template') ?? ''

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [email,    setEmail]    = useState('')
  const [method,   setMethod]   = useState<PayMethod>('card')
  const [promo,    setPromo]    = useState('')
  const [discount, setDiscount] = useState(0)
  const [agreed,   setAgreed]   = useState(true)
  const [paying,   setPaying]   = useState(false)
  const [promoMsg, setPromoMsg] = useState('')
  const [sdkReady, setSdkReady] = useState(false)

  // 토스 SDK 로드 (유료일 때만 실제로 필요하지만 미리 로드)
  useEffect(() => {
    if (document.getElementById('toss-sdk')) { setSdkReady(true); return }
    const script = document.createElement('script')
    script.id    = 'toss-sdk'
    script.src   = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => setSdkReady(true)
    document.head.appendChild(script)
  }, [])

  // 로그인 유저 이메일 자동 입력
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [])

  // 템플릿 로드
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

  const basePrice   = template.price ?? 0
  const origPrice   = template.original_price ?? basePrice
  const finalPrice  = Math.max(0, basePrice - discount)
  const isFree      = finalPrice === 0
  const discountPct = origPrice > 0
    ? Math.round((1 - basePrice / origPrice) * 100)
    : 0

  // 프로모 코드 검증
  async function applyPromo() {
    if (!promo.trim()) return
    const res  = await fetch('/api/promo/validate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: promo, templateSlug: slug }),
    })
    const data = await res.json()
    if (data.discountAmount) {
      setDiscount(data.discountAmount)
      setPromoMsg(`${promo.toUpperCase()} 적용 — ${formatPrice(data.discountAmount)} 할인!`)
    } else {
      setPromoMsg(data.error ?? '유효하지 않은 코드입니다')
      setTimeout(() => setPromoMsg(''), 2500)
    }
  }

  // 결제 실행
  async function handlePay() {
    if (!email || !agreed) return
    setPaying(true)

    const currentTemplate = template
    if (!currentTemplate) {
      setPaying(false)
      return
    }

    try {
      // ── 무료: Toss 없이 바로 서버 confirm ───────────────
      if (isFree) {
        const { data: { session } } = await supabase.auth.getSession()
        const fakeOrderId = `FREE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

        const res = await fetch('/api/payment/confirm', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            paymentKey:    'FREE',
            orderId:       fakeOrderId,
            amount:        0,
            templateSlug:  slug,
            email,
            paymentMethod: 'free',
            promoCode:     promo || undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          alert(data.error ?? '오류가 발생했어요')
          setPaying(false)
          return
        }

        router.push(
          `/checkout/success?orderId=${fakeOrderId}&amount=0` +
          `&template=${slug}&paymentKey=FREE` +
          `&customerEmail=${encodeURIComponent(email)}`
        )
        return
      }

      // ── 유료: Toss 결제 ──────────────────────────────────
      if (!sdkReady) return

      const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      const tossPayments  = window.TossPayments(tossClientKey)
      const tossOrderId   = `PKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      const methodMap: Record<PayMethod, string> = {
        card:     '카드',
        tosspay:  '토스페이',
        kakaopay: '카카오페이',
      }

      await tossPayments.requestPayment(methodMap[method], {
        amount:        finalPrice,
        orderId:       tossOrderId,
        orderName:     `${template.name} — pixelkits`,
        customerEmail: email,
        successUrl:    `${window.location.origin}/checkout/success?template=${slug}&orderId=${tossOrderId}&promoCode=${promo}&paymentMethod=${method}&customerEmail=${encodeURIComponent(email)}`,
        failUrl:       `${window.location.origin}/checkout?template=${slug}&error=payment_failed`,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'User Cancel') {
        console.error('[결제 오류]', err)
      }
      setPaying(false)
    }
  }

  const METHODS: { id: PayMethod; label: string; sub: string }[] = [
    { id: 'card',     label: '신용 · 체크카드', sub: '국내외 모든 카드' },
    { id: 'tosspay',  label: '토스페이',        sub: '간편결제'       },
    { id: 'kakaopay', label: '카카오페이',       sub: '간편결제'       },
  ]

  return (
    <div className="grid md:grid-cols-[1fr_360px] min-h-[calc(100vh-57px)]">

      {/* ── 왼쪽: 결제 폼 ── */}
      <div className="p-8 md:px-12 border-r border-white/[0.07]">

        {/* 진행 단계 */}
        <div className="flex items-center gap-2 mb-10 text-[13px]">
          {['상품 선택', '결제 정보', '다운로드'].map((step, i) => (
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
            {isFree ? '다운로드 링크를 보내드려요' : '결제 완료 후 다운로드 링크를 보내드려요'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            className="w-full bg-panel border border-white/10 rounded-xl px-4 py-3 text-[14px]
                       text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors"
          />
        </div>
        <p className="text-[12px] text-sand/30 mb-7">스팸 없음 · 다운로드 링크 + 영수증만 발송됩니다</p>

        <div className="h-px bg-white/[0.07] mb-7" />

        {/* 결제 수단 — 무료일 때 숨김 */}
        {!isFree && (
          <>
            <h2 className="font-syne font-bold text-[17px] mb-4">결제 수단</h2>
            <div className="flex gap-2.5 mb-7">
              {METHODS.map(({ id, label, sub }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={`flex-1 card-base rounded-xl p-3.5 flex items-center gap-2.5 transition-all cursor-pointer
                    ${method === id ? 'border-lime/40 bg-lime/[0.05]' : 'hover:border-white/20'}`}
                >
                  <div>
                    <p className="text-[13px] font-medium text-left">{label}</p>
                    <p className="text-[11px] text-sand/35 text-left">{sub}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border ml-auto flex-shrink-0 flex items-center justify-center
                    ${method === id ? 'border-lime bg-lime' : 'border-white/20'}`}>
                    {method === id && <div className="w-2 h-2 rounded-full bg-ink" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="h-px bg-white/[0.07] mb-7" />
          </>
        )}

        {/* 약관 동의 */}
        <label className="flex items-start gap-3 cursor-pointer mb-8">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-lime"
          />
          <span className="text-[13px] text-sand/50 leading-relaxed">
            구매 조건 및{' '}
            <a href="/terms" className="text-lime/70 underline" target="_blank">이용약관</a>을 확인하였으며 동의합니다
          </span>
        </label>
      </div>

      {/* ── 오른쪽: 주문 요약 ── */}
      <div className="p-8 bg-white/[0.02]">

        {/* 상품 정보 */}
        <div className="card-base rounded-2xl p-4 flex gap-3 mb-6">
          <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] border border-white/10 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium mb-1">{template.name}</p>
            <div className="flex gap-2 text-[12px] text-sand/35">
              {template.stack.slice(0, 2).map((s) => <span key={s}>⬡ {s}</span>)}
            </div>
          </div>
        </div>

        {/* 프로모 코드 */}
        <div className="mb-5">
          <p className="text-[12px] text-sand/45 mb-2">프로모션 코드</p>
          <div className="flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
              placeholder="코드 입력"
              className="flex-1 bg-panel border border-white/10 rounded-xl px-3 py-2.5 text-[13px]
                         text-sand placeholder:text-sand/20 outline-none focus:border-lime/40
                         transition-colors uppercase"
            />
            <button
              onClick={applyPromo}
              className="bg-white/[0.07] border border-white/10 rounded-xl px-4 text-[13px]
                         hover:border-white/20 transition-colors cursor-pointer"
            >
              적용
            </button>
          </div>
          {promoMsg && (
            <p className={`text-[12px] mt-1.5 ${promoMsg.includes('적용') ? 'text-teal' : 'text-[#ff5f3f]'}`}>
              {promoMsg}
            </p>
          )}
        </div>

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
          {!isFree && (
            <div className="flex justify-between text-[13px]">
              <span className="text-sand/40">부가세 (10%)</span>
              <span className="text-sand">포함</span>
            </div>
          )}
          <div className="h-px bg-white/[0.07] my-1" />
          <div className="flex justify-between">
            <span className="font-syne font-bold text-[15px]">최종 결제</span>
            <span className="font-syne font-extrabold text-[22px] text-lime">
              {formatPrice(finalPrice)}
            </span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <button
          onClick={handlePay}
          disabled={!email || !agreed || paying || (!isFree && !sdkReady)}
          className="btn-lime w-full justify-center text-[15px] py-4 rounded-2xl mb-3
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {paying
            ? '처리 중...'
            : isFree
            ? '⬇ 무료로 다운로드'
            : `🔒 ${formatPrice(finalPrice)} 결제하기`}
        </button>

        <div className="flex justify-center gap-4 text-[11px] text-sand/25 mb-5">
          {isFree ? (
            <span>⬇ 즉시 다운로드</span>
          ) : (
            <>
              <span>🛡 안전결제</span>
              <span>↻ 7일 환불</span>
              <span>⬇ 즉시 다운로드</span>
            </>
          )}
        </div>

        <div className={`border rounded-xl p-3 text-[12px] leading-relaxed
          ${isFree
            ? 'bg-lime/[0.05] border-lime/15 text-lime/80'
            : 'bg-teal/[0.07] border-teal/15 text-teal/85'}`}>
          {isFree
            ? '이메일을 입력하면 즉시 다운로드 링크를 보내드려요.'
            : <>결제 후 <strong className="text-teal">즉시</strong> 다운로드 링크가 이메일로 발송됩니다. 7일 이내 미사용 시 전액 환불 가능.</>}
        </div>
      </div>
    </div>
  )
}