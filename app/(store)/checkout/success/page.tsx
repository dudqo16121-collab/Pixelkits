'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { Template } from '@/types'

type Status = 'confirming' | 'success' | 'error'

export default function CheckoutSuccessPage() {
  const params = useSearchParams()

  const paymentKey   = params.get('paymentKey')   ?? ''
  const orderId      = params.get('orderId')       ?? ''
  const dbOrderId    = params.get('dbOrderId')     ?? '' // FREE 주문 시 DB order.id
  const amount       = Number(params.get('amount') ?? '0')
  const templateSlug = params.get('template')      ?? ''
  const promoCode    = params.get('promoCode')     ?? ''

  const [status,      setStatus]      = useState<Status>('confirming')
  const [errorMsg,    setErrorMsg]    = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [finalOrderId,setFinalOrderId]= useState('')
  const [tokenExpires,setTokenExpires]= useState('')
  const [template,    setTemplate]    = useState<Template | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentKey || !orderId) {
      setErrorMsg('잘못된 접근입니다')
      setStatus('error')
      return
    }
    confirmPayment()
  }, [])

  async function confirmPayment() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // ── 무료: URL 파라미터로 이미 dbOrderId 전달받음 ─────
      if (paymentKey === 'FREE') {
        if (dbOrderId) {
          // 최신 방식: confirm API 응답의 orderId를 URL로 전달
          setFinalOrderId(dbOrderId)

          const { data: order } = await supabase
            .from('orders')
            .select('order_number, token_expires_at')
            .eq('id', dbOrderId)
            .single()

          if (order) {
            setOrderNumber(order.order_number)
            setTokenExpires(order.token_expires_at)
          }
        } else {
          // 구버전 호환: toss_order_id로 조회 (재시도 포함)
          let order = null
          for (let i = 0; i < 3; i++) {
            const { data } = await supabase
              .from('orders')
              .select('id, order_number, token_expires_at')
              .eq('toss_order_id', orderId)
              .maybeSingle()
            if (data) { order = data; break }
            await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
          }

          if (!order) {
            setErrorMsg('주문 정보를 찾을 수 없어요. 잠시 후 구매 내역에서 확인해주세요.')
            setStatus('error')
            return
          }
          setFinalOrderId(order.id)
          setOrderNumber(order.order_number)
          setTokenExpires(order.token_expires_at)
        }

        const { data: tmpl } = await supabase
          .from('templates').select('*').eq('slug', templateSlug).single()
        if (tmpl) setTemplate(tmpl as Template)

        setStatus('success')
        return
      }

      // ── 유료: confirm API 호출 ───────────────────────────
      const res = await fetch('/api/payment/confirm', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
          templateSlug,
          email:         params.get('customerEmail') ?? '',
          paymentMethod: detectMethod(),
          promoCode,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? '결제 확인에 실패했어요')
        setStatus('error')
        return
      }

      setFinalOrderId(data.orderId ?? '')
      setOrderNumber(data.orderNumber)
      setTokenExpires(data.tokenExpiresAt)

      const { data: tmpl } = await supabase
        .from('templates').select('*').eq('slug', templateSlug).single()
      if (tmpl) setTemplate(tmpl as Template)

      setStatus('success')

    } catch (err) {
      console.error(err)
      setErrorMsg('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.')
      setStatus('error')
    }
  }

  function detectMethod(): 'card' | 'tosspay' | 'kakaopay' {
    const pm = params.get('paymentMethod')
    if (pm === 'tosspay')  return 'tosspay'
    if (pm === 'kakaopay') return 'kakaopay'
    return 'card'
  }

  async function handleDownload(fileType: string) {
    if (!finalOrderId) return
    setDownloading(fileType)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/download?orderId=${finalOrderId}&type=${fileType}`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      })
      if (res.redirected) { window.location.href = res.url; return }
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '다운로드에 실패했어요')
      }
    } finally {
      setDownloading(null)
    }
  }

  if (status === 'confirming') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="w-8 h-8 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
      <p className="text-[14px] text-sand/40">
        {paymentKey === 'FREE' ? '다운로드를 준비하는 중이에요...' : '결제를 확인하는 중이에요...'}
      </p>
    </div>
  )

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-8">
      <div className="text-4xl">⚠</div>
      <h1 className="font-syne font-bold text-xl">오류가 발생했어요</h1>
      <p className="text-[14px] text-sand/50">{errorMsg}</p>
      <div className="flex gap-3 mt-2">
        <Link href="/orders" className="btn-lime">구매 내역 확인</Link>
        <Link href="/templates" className="border border-white/15 rounded-full px-5 py-2.5 text-[14px] text-sand/60 hover:text-sand transition-colors">템플릿 목록</Link>
      </div>
    </div>
  )

  const isFree = paymentKey === 'FREE'
  const files = [
    { icon: '🗜', key: 'source',  name: `${template?.slug ?? 'template'}-v1.zip`, size: '소스코드 전체' },
    { icon: '📄', key: 'guide',   name: '설치-가이드-한국어.pdf',                  size: '설치 가이드'   },
    { icon: '📋', key: 'license', name: 'license.txt',                             size: '라이선스 문서' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-lime/10 border border-lime/20
                        flex items-center justify-center mx-auto mb-5 text-3xl">
          ✓
        </div>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2">
          {isFree ? '다운로드 준비 완료!' : '결제 완료!'}
        </h1>
        <p className="text-[14px] text-sand/40 font-light">
          주문번호 <span className="text-sand/70 font-medium">{orderNumber}</span>
        </p>
      </div>

      <div className="card-base rounded-2xl p-5 mb-6">
        <div className="flex gap-4 items-start mb-5">
          <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                          border border-white/10 flex-shrink-0" />
          <div>
            <h2 className="font-syne font-bold text-[16px] mb-1">
              {template?.name ?? 'pixelkits 템플릿'}
            </h2>
            <div className="flex gap-3 text-[12px] text-sand/35">
              <span>⬡ {template?.stack?.[0] ?? 'Next.js'}</span>
              <span>✦ 상업적 라이선스</span>
              <span>↻ 평생 업데이트</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {files.map(({ icon, key, name, size }) => (
            <div key={key}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-lime/[0.08] border border-lime/15
                              flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{name}</p>
                <p className="text-[11px] text-sand/30">{size}</p>
              </div>
              <button
                onClick={() => handleDownload(key)}
                disabled={downloading === key || !finalOrderId}
                className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5 rounded-lg
                           hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50">
                {downloading === key ? '...' : '↓ 다운로드'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => handleDownload('all')}
          disabled={downloading === 'all' || !finalOrderId}
          className="btn-lime w-full justify-center py-3.5 rounded-xl disabled:opacity-50">
          {downloading === 'all' ? '⏳ 준비중...' : '⬇ 전체 파일 한번에 받기'}
        </button>

        <p className="text-[12px] text-sand/25 mt-3 flex items-center gap-1.5 flex-wrap">
          🕐 다운로드 링크는 <strong className="text-sand/40">72시간</strong> 유효
          {tokenExpires && (
            <span>· 만료: {new Date(tokenExpires).toLocaleDateString('ko-KR')}</span>
          )}
          · 이후 구매 내역에서 재발급 가능
        </p>
      </div>

      <h2 className="font-syne font-bold text-[13px] text-sand/35 uppercase tracking-wider mb-3">
        다음 단계
      </h2>
      <div className="space-y-2.5">
        {[
          { icon: '⌨', title: '프로젝트 설치하기', desc: 'npm install → npm run dev로 바로 시작',         href: '/orders'    },
          { icon: '🚀', title: 'Vercel에 배포하기', desc: 'GitHub 연결 후 원클릭 배포 — 5분이면 라이브', href: '/orders'    },
          { icon: '📁', title: '다운로드 페이지',   desc: '구매 내역에서 언제든 다시 다운로드 가능',      href: '/downloads' },
        ].map(({ icon, title, desc, href }) => (
          <Link key={title} href={href}
            className="card-base rounded-xl p-4 flex items-start gap-3.5
                       hover:border-white/18 transition-colors block">
            <div className="w-9 h-9 rounded-lg bg-lime/[0.08] flex items-center justify-center
                            flex-shrink-0 text-base">
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium mb-0.5">{title}</p>
              <p className="text-[12px] text-sand/40">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}