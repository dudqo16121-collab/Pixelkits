'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  user_email: string
  amount: number
  payment_method: string
  payment_key: string | null
  status: string
  created_at: string
  templates?: { name: string }
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-teal/12 text-teal border-teal/20',
  refunded:  'bg-[#ff5f3f]/12 text-[#ff5f3f] border-[#ff5f3f]/20',
  pending:   'bg-amber-500/12 text-amber-400 border-amber-500/20',
  failed:    'bg-white/[0.07] text-sand/40 border-white/10',
}
const STATUS_LABEL: Record<string, string> = {
  completed: '완료', refunded: '환불', pending: '대기', failed: '실패',
}

export default function AdminOrdersPage() {
  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [status,    setStatus]    = useState('all')
  const [refunding, setRefunding] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, templates(name), payment_key')
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }

  async function handleRefund(order: Order) {
    const reason = prompt(
      `환불 사유를 입력해주세요.\n주문: ${order.order_number} / ₩${order.amount.toLocaleString()}`
    )
    if (reason === null) return // 취소 클릭

    setRefunding(order.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId: order.id, reason: reason || '고객 요청 환불' }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert('환불 실패: ' + data.error)
        return
      }

      alert(`환불 완료! ₩${data.refundAmount.toLocaleString()} 환불됐어요.`)
      await fetchOrders()
    } finally {
      setRefunding(null)
    }
  }

  async function markCompleted(id: string) {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
    await fetchOrders()
  }

  const filtered = orders.filter((o) => {
    const matchQ =
      !query ||
      o.order_number?.includes(query) ||
      o.user_email?.includes(query) ||
      o.templates?.name?.includes(query)
    const matchS = status === 'all' || o.status === status
    return matchQ && matchS
  })

  const totalRevenue = filtered
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.amount, 0)

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const min  = Math.floor(diff / 60000)
    if (min < 60)  return `${min}분 전`
    const hr = Math.floor(min / 60)
    if (hr < 24)   return `${hr}시간 전`
    return `${Math.floor(hr / 24)}일 전`
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">주문 조회</h1>
        <p className="text-[14px] text-sand/40">
          총 {filtered.length}건 · 완료 매출 ₩{totalRevenue.toLocaleString()}
        </p>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="주문번호, 이메일, 템플릿명 검색..."
            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-11 pr-4
                       text-[14px] text-sand placeholder:text-sand/20
                       outline-none focus:border-lime/40 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-[#111] border border-white/10 rounded-xl p-1">
          {[
            { v: 'all',       l: '전체' },
            { v: 'completed', l: '완료' },
            { v: 'pending',   l: '대기' },
            { v: 'refunded',  l: '환불' },
            { v: 'failed',    l: '실패' },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                ${status === v ? 'bg-white/10 text-sand' : 'text-sand/40 hover:text-sand'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">

        {/* 컬럼 헤더 */}
        <div className="grid grid-cols-[1.8fr_1.2fr_90px_90px_80px_110px] gap-4 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30
                        uppercase tracking-wider font-syne font-bold">
          <span>주문 / 템플릿</span>
          <span>이메일</span>
          <span>결제 수단</span>
          <span>금액</span>
          <span>상태</span>
          <span>액션</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sand/30">
            <p className="text-2xl mb-2">🧾</p>
            <p className="text-[13px]">
              {query ? '검색 결과가 없어요' : '주문이 없어요'}
            </p>
          </div>
        ) : (
          filtered.map((o, i) => (
            <div
              key={o.id}
              className={`grid grid-cols-[1.8fr_1.2fr_90px_90px_80px_110px] gap-4 items-center
                          px-6 py-4 text-[13px]
                          ${i < filtered.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>

              {/* 주문번호 + 템플릿명 */}
              <div>
                <p className="font-medium truncate">{o.templates?.name ?? '—'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-sand/30 font-mono">{o.order_number}</p>
                  <span className="text-[10px] text-sand/20">·</span>
                  <p className="text-[11px] text-sand/25">{timeAgo(o.created_at)}</p>
                </div>
              </div>

              {/* 이메일 */}
              <span className="text-sand/50 truncate text-[12px]">{o.user_email}</span>

              {/* 결제 수단 */}
              <span className="text-sand/50 text-[12px]">
                {o.payment_method === 'card'
                  ? '신용카드'
                  : o.payment_method === 'tosspay'
                  ? '토스페이'
                  : o.payment_method === 'kakaopay'
                  ? '카카오페이'
                  : o.payment_method}
              </span>

              {/* 금액 */}
              <span className={`font-syne font-bold ${o.amount > 0 ? 'text-lime' : 'text-sand/30'}`}>
                {o.amount > 0 ? `₩${o.amount.toLocaleString()}` : '무료'}
              </span>

              {/* 상태 배지 */}
              <span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
                  ${STATUS_STYLE[o.status] ?? 'text-sand/40 border-white/10'}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </span>

              {/* 액션 버튼 */}
              <div className="flex gap-1.5">
                {o.status === 'completed' && (
                  <button
                    onClick={() => handleRefund(o)}
                    disabled={refunding === o.id}
                    className="text-[11px] text-[#ff5f3f]/60 border border-[#ff5f3f]/15
                               rounded-lg px-2.5 py-1.5 hover:text-[#ff5f3f]
                               hover:border-[#ff5f3f]/30 transition-colors
                               cursor-pointer disabled:opacity-30">
                    {refunding === o.id ? '처리 중...' : '환불'}
                  </button>
                )}
                {o.status === 'pending' && (
                  <button
                    onClick={() => markCompleted(o.id)}
                    className="text-[11px] text-teal border border-teal/20 rounded-lg
                               px-2.5 py-1.5 hover:opacity-75 transition-opacity cursor-pointer">
                    완료 처리
                  </button>
                )}
                {o.status === 'refunded' && (
                  <span className="text-[11px] text-sand/25">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}