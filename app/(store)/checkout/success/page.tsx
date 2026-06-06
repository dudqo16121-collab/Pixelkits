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

  // 토스페이먼츠가 리다이렉트 시 붙여주는 쿼리파라미터
  const paymentKey  = params.get('paymentKey')   ?? ''
  const orderId     = params.get('orderId')       ?? ''   // toss_order_id
  const amount      = Number(params.get('amount') ?? '0')
  const templateSlug = params.get('template')    ?? ''
  const promoCode   = params.get('promoCode')    ?? ''

  const [status,       setStatus]       = useState<Status>('confirming')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [orderNumber,  setOrderNumber]  = useState('')
  const [downloadToken, setDownloadToken] = useState('')
  const [tokenExpires, setTokenExpires] = useState('')
  const [template,     setTemplate]     = useState<Template | null>(null)
  const [downloading,  setDownloading]  = useState<string | null>(null)

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setErrorMsg('잘못된 접근입니다')
      setStatus('error')
      return
    }
    confirmPayment()
  }, [])

  async function confirmPayment() {
    try {
      // 로그인 토큰 가져오기 (있으면 서버에서 user_id 매핑)
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch('/api/payment/confirm', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
          templateSlug,
          email: params.get('customerEmail') ?? '',
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

      setOrderNumber(data.orderNumber)
      setDownloadToken(data.downloadToken)
      setTokenExpires(data.tokenExpiresAt)

      // 템플릿 정보는 Supabase에서 조회
      const { data: tmpl } = await supabase
        .from('templates')
        .select('*')
        .eq('slug', templateSlug)
        .single()
      if (tmpl) setTemplate(tmpl as Template)

      setStatus('success')
    } catch (err) {
      console.error(err)
      setErrorMsg('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.')
      setStatus('error')
    }
  }

  // 결제수단 추론 (토스는 별도 파라미터로 주지 않음 — 필요 시 orderId prefix로 구분)
  function detectMethod(): 'card' | 'tosspay' | 'kakaopay' {
    const pm = params.get('paymentMethod')
    if (pm === 'tosspay') return 'tosspay'
    if (pm === 'kakaopay') return 'kakaopay'
    return 'card'
  }

  // 파일 다운로드 (Signed URL 방식 - STEP 2에서 구현)
  async function handleDownload(fileType: string) {
    if (!downloadToken) return
    setDownloading(fileType)
    try {
      const res = await fetch(`/api/download?token=${downloadToken}&type=${fileType}`)
      if (!res.ok) { alert('다운로드에 실패했어요'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = fileType === 'source'
        ? `${template?.slug ?? 'template'}-v1.zip`
        : fileType === 'guide'
        ? '설치-가이드-한국어.pdf'
        : 'license.txt'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  // ── 결제 확인 중 ──────────────────────────────────────
  if (status === 'confirming') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="w-8 h-8 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
      <p className="text-[14px] text-sand/40">결제를 확인하는 중이에요...</p>
    </div>
  )

  // ── 오류 ──────────────────────────────────────────────
  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-8">
      <div className="text-4xl">⚠</div>
      <h1 className="font-syne font-bold text-xl">결제 확인 실패</h1>
      <p className="text-[14px] text-sand/50">{errorMsg}</p>
      <Link href="/templates" className="btn-lime mt-2">템플릿 목록으로</Link>
    </div>
  )

  // ── 성공 ──────────────────────────────────────────────
  const files = [
    { icon: '🗜', key: 'source',  name: `${template?.slug ?? 'template'}-v1.zip`, size: '소스코드 전체 · 4.8 MB' },
    { icon: '📄', key: 'guide',   name: '설치-가이드-한국어.pdf',                  size: '설치 가이드 · 1.1 MB' },
    { icon: '📋', key: 'license', name: 'license.txt',                              size: '라이선스 문서 · 12 KB' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* 완료 헤더 */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center mx-auto mb-5 text-3xl">
          ✓
        </div>
        <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2">결제 완료!</h1>
        <p className="text-[14px] text-sand/40 font-light">
          주문번호 <span className="text-sand/70 font-medium">{orderNumber}</span>
        </p>
      </div>

      {/* 구매 상품 */}
      <div className="card-base rounded-2xl p-5 mb-6">
        <div className="flex gap-4 items-start mb-5">
          <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] border border-white/10 flex-shrink-0" />
          <div>
            <h2 className="font-syne font-bold text-[16px] mb-1">{template?.name ?? 'pixelkits 템플릿'}</h2>
            <div className="flex gap-3 text-[12px] text-sand/35">
              <span>⬡ {template?.stack[0] ?? 'Next.js'}</span>
              <span>✦ 상업적 라이선스</span>
              <span>↻ 평생 업데이트</span>
            </div>
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="space-y-2.5 mb-5">
          {files.map(({ icon, key, name, size }) => (
            <div key={key} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-lime/[0.08] border border-lime/15 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{name}</p>
                <p className="text-[11px] text-sand/30">{size}</p>
              </div>
              <button
                onClick={() => handleDownload(key)}
                disabled={downloading === key}
                className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5 rounded-lg
                           hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {downloading === key ? '...' : '↓ 다운로드'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => handleDownload('all')}
          className="btn-lime w-full justify-center py-3.5 rounded-xl"
        >
          ⬇ 전체 파일 한번에 받기
        </button>

        <p className="text-[12px] text-sand/25 mt-3 flex items-center gap-1.5">
          🕐 다운로드 링크는 <strong className="text-sand/40">72시간</strong> 유효 ·{' '}
          {tokenExpires && (
            <span>만료: {new Date(tokenExpires).toLocaleDateString('ko-KR')}</span>
          )}{' '}
          · 이후 구매 내역에서 재발급 가능
        </p>
      </div>

      {/* 다음 단계 */}
      <h2 className="font-syne font-bold text-[13px] text-sand/35 uppercase tracking-wider mb-3">다음 단계</h2>
      <div className="space-y-2.5">
        {[
          { icon: '⌨', title: '프로젝트 설치하기',  desc: 'npm install → npm run dev로 바로 시작',   href: '#' },
          { icon: '🚀', title: 'Vercel에 배포하기',  desc: 'GitHub 연결 후 원클릭 배포 — 5분이면 라이브', href: '#' },
          { icon: '🎨', title: '커스터마이징 가이드', desc: '색상, 폰트, 텍스트 변경 방법 확인',         href: '#' },
        ].map(({ icon, title, desc }) => (
          <Link key={title} href="/orders"
            className="card-base rounded-xl p-4 flex items-start gap-3.5 hover:border-white/18 transition-colors cursor-pointer block">
            <div className="w-9 h-9 rounded-lg bg-lime/[0.08] flex items-center justify-center flex-shrink-0 text-base">{icon}</div>
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
