'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { useUser } from '@/lib/UserContext'
import { useOrders } from '@/lib/useOrders'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]
const METHOD_LABEL: Record<string, string> = {
  card:     '신용카드',
  tosspay:  '토스페이',
  kakaopay: '카카오페이',
  free:     '무료',
}

export default function OrdersPage() {
  const pathname                = usePathname()
  const { userName, userEmail } = useUser()
  const { orders, loading, refreshing, refreshToken } = useOrders()
  const [open, setOpen]         = useState<string | null>(null)

  const totalAmount = orders.reduce((s, o) => s + o.amount, 0)
  const totalSaved  = orders.reduce((s, o) => s + (o.discount_amount ?? 0), 0)
  const initial     = userName?.[0] ?? userEmail?.[0] ?? '?'

  return (
    <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-57px)]">

      {/* ── 사이드바 ── */}
      <aside className="p-6 border-r border-white/[0.07]">
        <div className="card-base rounded-xl p-4 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime/12 border border-lime/25
                          flex items-center justify-center font-syne font-bold text-lime">
            {initial}
          </div>
          <div>
            <p className="text-[13px] font-medium">{userName || '이름 없음'}</p>
            <p className="text-[11px] text-sand/35 truncate">{userEmail}</p>
          </div>
        </div>
        <div className="space-y-1">
          {SIDEBAR.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`block px-3 py-2.5 rounded-xl text-[13px] transition-colors
                ${pathname === href
                  ? 'bg-lime/[0.08] text-sand font-medium'
                  : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
              {label}
            </Link>
          ))}
        </div>
      </aside>

      {/* ── 본문 ── */}
      <div className="p-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-6">구매 내역</h1>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: '총 구매 금액',  val: formatPrice(totalAmount), sub: `${orders.length}건 구매`,  color: ''          },
            { label: '절약한 금액',   val: formatPrice(totalSaved),  sub: '할인 포함',                color: 'text-teal'  },
            { label: '다운로드 가능', val: `${orders.filter(o => o.status === 'completed').length}`, sub: '평생 접근 가능', color: 'text-lime' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} className="card-base rounded-xl p-4">
              <p className="text-[12px] text-sand/35 mb-1.5">{label}</p>
              <p className={`font-syne font-bold text-xl ${color}`}>{val}</p>
              <p className="text-[11px] text-sand/25 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
            불러오는 중...
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-20 text-sand/30">
            <p className="text-4xl mb-4">🧾</p>
            <p className="text-[15px] mb-2">아직 구매 내역이 없어요</p>
            <Link href="/templates" className="btn-lime mt-4 inline-flex">템플릿 둘러보기</Link>
          </div>
        )}

        {/* 주문 목록 */}
        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const tmpl      = order.templates
              const isExpired = new Date(order.token_expires_at) < new Date()

              // 상태 뱃지
              const statusBadge = {
                completed:      { label: '✓ 완료',   cls: 'bg-teal/12 text-teal border-teal/20'                      },
                partial_refund: { label: '부분환불', cls: 'bg-amber-500/12 text-amber-400 border-amber-500/20'        },
                refunded:       { label: '전액환불', cls: 'bg-[#ff5f3f]/12 text-[#ff5f3f] border-[#ff5f3f]/20'       },
              }[order.status] ?? { label: order.status, cls: 'bg-white/[0.07] text-sand/40 border-white/10' }

              return (
                <div key={order.id}
                  className={`card-base rounded-2xl overflow-hidden transition-colors
                    ${open === order.id ? 'border-lime/20' : 'hover:border-white/14'}`}>

                  {/* 헤더 행 */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => setOpen(open === order.id ? null : order.id)}>
                    <div className="w-14 h-11 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                                    flex-shrink-0 border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate">{tmpl?.name ?? '—'}</p>
                      <p className="text-[12px] text-sand/35 mt-0.5">
                        {formatDate(order.created_at)} · #{order.order_number}
                      </p>
                    </div>
                    {/* 동적 상태 뱃지 */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.cls}`}>
                      {statusBadge.label}
                    </span>
                    <span className="font-syne font-bold text-[15px] text-lime">
                      {formatPrice(order.amount)}
                    </span>
                    <span className={`text-sand/25 transition-transform text-[11px] ${open === order.id ? 'rotate-180' : ''}`}>▾</span>
                  </div>

                  {/* 펼쳐진 상세 */}
                  {open === order.id && (
                    <div className="border-t border-white/[0.06] p-5 grid grid-cols-2 gap-5">
                      <div>
                        <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">결제 정보</p>
                        {[
                          { k: '결제 수단', v: METHOD_LABEL[order.payment_method] ?? order.payment_method },
                          { k: '결제 금액', v: formatPrice(order.amount) },
                          { k: '할인 금액', v: order.discount_amount > 0 ? `-${formatPrice(order.discount_amount)}` : '없음' },
                          ...(order.refunded_amount > 0 ? [
                            { k: '환불 금액', v: `-${formatPrice(order.refunded_amount)}` },
                          ] : []),
                          { k: '라이선스',  v: '상업적 사용 가능' },
                        ].map(({ k, v }) => (
                          <div key={k} className="flex justify-between text-[12px] py-1.5 border-b border-white/[0.04]">
                            <span className="text-sand/40">{k}</span>
                            <span className={k === '환불 금액' ? 'text-[#ff5f3f]/70' : ''}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">파일 정보</p>
                        {[
                          { k: '스택',      v: tmpl?.stack?.[0] ?? '—' },
                          { k: '버전',      v: 'v1.0 (최신)' },
                          { k: '업데이트',  v: '평생 무료' },
                          { k: '링크 만료', v: isExpired ? '만료됨' : formatDate(order.token_expires_at) },
                        ].map(({ k, v }) => (
                          <div key={k} className="flex justify-between text-[12px] py-1.5 border-b border-white/[0.04]">
                            <span className="text-sand/40">{k}</span>
                            <span className={k === '링크 만료' && isExpired ? 'text-[#ff5f3f]/70' : ''}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="col-span-2 flex gap-2 pt-2 border-t border-white/[0.06] flex-wrap">
                        {order.status === 'completed' && !isExpired ? (
                          <Link href="/downloads" className="btn-lime text-[12px] px-4 py-2">
                            ⬇ 다운로드 페이지
                          </Link>
                        ) : order.status === 'completed' && isExpired ? (
                          <button
                            onClick={() => refreshToken(order.id)}
                            disabled={refreshing === order.id}
                            className="btn-lime text-[12px] px-4 py-2 disabled:opacity-50">
                            {refreshing === order.id ? '재발급 중...' : '↻ 링크 재발급'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}