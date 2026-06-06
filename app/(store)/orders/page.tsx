'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

const MOCK_ORDERS = [
  {
    id: '1',
    order_number: 'PKT-20260605-8821',
    template: { name: 'Lumina SaaS Landing Kit', stack: ['nextjs'], slug: 'lumina-saas-kit' },
    amount: 29000,
    created_at: '2026-06-05T10:00:00Z',
    method: '신용카드 ****8821',
  },
  {
    id: '2',
    order_number: 'PKT-20260522-4413',
    template: { name: 'Astra Landing', stack: ['nextjs'], slug: 'astra-landing' },
    amount: 19000,
    created_at: '2026-05-22T14:30:00Z',
    method: '카카오페이',
  },
]

export default function OrdersPage() {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-57px)]">
      <aside className="p-6 border-r border-white/[0.07]">
        <div className="card-base rounded-xl p-4 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime/12 border border-lime/25 flex items-center justify-center font-syne font-bold text-lime">김</div>
          <div><p className="text-[13px] font-medium">김개발</p><p className="text-[11px] text-sand/35">dev@example.com</p></div>
        </div>
        <div className="space-y-1">
          {SIDEBAR.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`block px-3 py-2.5 rounded-xl text-[13px] transition-colors
                ${pathname === href ? 'bg-lime/[0.08] text-sand font-medium' : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
              {label}
            </Link>
          ))}
        </div>
      </aside>

      <div className="p-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-6">구매 내역</h1>

        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: '총 구매 금액', val: formatPrice(MOCK_ORDERS.reduce((s,o) => s+o.amount,0)), sub: `${MOCK_ORDERS.length}건 구매` },
            { label: '절약한 금액',  val: formatPrice(10000), sub: '할인 포함', color: 'text-teal' },
            { label: '다운로드 가능', val: `${MOCK_ORDERS.length}`, sub: '평생 접근 가능', color: 'text-lime' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} className="card-base rounded-xl p-4">
              <p className="text-[12px] text-sand/35 mb-1.5">{label}</p>
              <p className={`font-syne font-bold text-xl ${color ?? ''}`}>{val}</p>
              <p className="text-[11px] text-sand/25 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {MOCK_ORDERS.map((order) => (
            <div key={order.id} className={`card-base rounded-2xl overflow-hidden transition-colors ${open === order.id ? 'border-lime/20' : 'hover:border-white/14'}`}>
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setOpen(open === order.id ? null : order.id)}>
                <div className="w-14 h-11 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] flex-shrink-0 border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">{order.template.name}</p>
                  <p className="text-[12px] text-sand/35 mt-0.5">{formatDate(order.created_at)} · #{order.order_number}</p>
                </div>
                <span className="badge-teal text-[11px] px-2.5 py-1">✓ 완료</span>
                <span className="font-syne font-bold text-[15px] text-lime">{formatPrice(order.amount)}</span>
                <span className={`text-sand/25 transition-transform ${open === order.id ? 'rotate-180' : ''}`}>▾</span>
              </div>

              {open === order.id && (
                <div className="border-t border-white/[0.06] p-5 grid grid-cols-2 gap-5">
                  <div>
                    <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">결제 정보</p>
                    {[
                      { k: '결제 수단', v: order.method },
                      { k: '결제 금액', v: formatPrice(order.amount) },
                      { k: '라이선스',  v: '상업적 사용 가능' },
                    ].map(({ k, v }) => (
                      <div key={k} className="flex justify-between text-[12px] py-1.5 border-b border-white/[0.04]">
                        <span className="text-sand/40">{k}</span><span>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-wider mb-3">파일 정보</p>
                    {[
                      { k: '스택',     v: order.template.stack[0] },
                      { k: '버전',     v: 'v1.2 (최신)' },
                      { k: '업데이트', v: '평생 무료' },
                    ].map(({ k, v }) => (
                      <div key={k} className="flex justify-between text-[12px] py-1.5 border-b border-white/[0.04]">
                        <span className="text-sand/40">{k}</span>
                        <span className={k === '업데이트' ? 'text-teal' : ''}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 flex gap-2 pt-2 border-t border-white/[0.06]">
                    <Link href="/downloads" className="btn-lime text-[12px] px-4 py-2">⬇ 다시 다운로드</Link>
                    <button className="btn-ghost text-[12px] px-4 py-2">📋 영수증 보기</button>
                    <button className="ml-auto text-[12px] text-[#ff5f3f]/70 border border-[#ff5f3f]/20 rounded-full px-4 py-2 hover:text-[#ff5f3f] transition-colors cursor-pointer">환불 요청</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
