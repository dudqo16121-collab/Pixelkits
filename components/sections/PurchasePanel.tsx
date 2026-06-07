'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

interface Props {
  template: any
  discount: number
}

export function PurchasePanel({ template, discount }: Props) {
  const { userId } = useUser()
  const router     = useRouter()

  // null = 로딩 중, false = 미구매, string = 기구매 (orderId)
  const [purchased,   setPurchased]   = useState<null | false | string>(null)
  const [checkingPurchase, setCheckingPurchase] = useState(true)

  useEffect(() => {
    if (userId === null) return // UserContext 로드 중
    if (!userId) { setPurchased(false); setCheckingPurchase(false); return }

    supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', template.id)
      .eq('status', 'completed')
      .maybeSingle()
      .then(({ data }) => {
        setPurchased(data ? data.id : false)
        setCheckingPurchase(false)
      })
  }, [userId, template.id])

  return (
    <div className="p-6 bg-[#0d0d0d]">
      <div className="card-base rounded-2xl p-6 mb-4 sticky top-6">

        {/* 가격 */}
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-syne font-extrabold text-3xl text-lime">
            {formatPrice(template.price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-[15px] text-sand/30 line-through">
                {formatPrice(template.original_price)}
              </span>
              <span className="text-[11px] font-bold text-[#ff5f3f] bg-[#ff5f3f]/15
                               border border-[#ff5f3f]/20 rounded-full px-2 py-0.5">
                -{discount}%
              </span>
            </>
          )}
        </div>
        <p className="text-[12px] text-sand/35 mb-5">부가세 포함 · 1회 결제 · 평생 사용</p>

        {/* ── 버튼 영역 ── */}
        {checkingPurchase ? (
          // 로딩
          <div className="w-full h-14 rounded-xl bg-white/[0.05] animate-pulse mb-2.5" />
        ) : purchased ? (
          // 기구매 — 다운로드로 이동
          <>
            <div className="flex items-center gap-2.5 bg-teal/[0.08] border border-teal/20
                            rounded-xl p-3 mb-3 text-[13px] text-teal/90">
              <span className="text-base">✓</span>
              <span>이미 구매한 템플릿이에요</span>
            </div>
            <Link href="/downloads"
              className="btn-lime w-full justify-center text-[15px] py-4 rounded-xl mb-2.5 flex items-center gap-2">
              ⬇ 다운로드 페이지로 이동
            </Link>
          </>
        ) : (
          // 미구매 — 구매하기
          <>
            <Link href={`/checkout?template=${template.slug}`}
              className="btn-lime w-full justify-center text-[15px] py-4 rounded-xl mb-2.5 flex items-center gap-2">
              🛒 지금 구매하기
            </Link>
          </>
        )}

        {/* 미리보기 버튼 (항상 표시) */}
        <Link href={`/preview/${template.slug}`}
          className="flex items-center justify-center gap-2 w-full
                     border border-white/12 rounded-xl py-3.5 mb-5
                     text-[14px] text-sand/60 hover:text-sand hover:border-white/30 transition-all">
          ⛶ 라이브 미리보기
        </Link>

        {/* 환불 보장 */}
        {!purchased && (
          <div className="flex items-center gap-2.5 bg-teal/[0.07] border border-teal/15
                          rounded-xl p-3 mb-5 text-[12px] text-teal/90">
            <span className="text-base">🛡</span>
            <span>7일 환불 보장 — 만족 못하면 전액 환불</span>
          </div>
        )}

        {/* 스펙 */}
        <div className="flex flex-col gap-2.5">
          {[
            { k: '파일 형식', v: '.zip' },
            { k: '업데이트', v: '평생 무료' },
            { k: '라이선스', v: '상업적 사용 가능' },
            { k: '다운로드', v: '결제 즉시 제공' },
            { k: '파일 크기', v: template.file_size_kb
                ? `${(template.file_size_kb / 1024).toFixed(1)} MB`
                : '—' },
            { k: '평점', v: `★ ${template.rating ?? '—'}` },
          ].map(({ k, v }) => (
            <div key={k} className="flex justify-between text-[13px]">
              <span className="text-sand/35">{k}</span>
              <span className="text-sand/70">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}