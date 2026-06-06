'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  user_email: string
  amount: number
  payment_method: string
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
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [status,  setStatus]  = useState('all')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, templates(name)')
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    await fetchOrders()
  }

  const filtered = orders.filter((o) => {
    const matchQ = !query ||
      o.order_number?.includes(query) ||
      o.user_email?.includes(query) ||
      o.templates?.name?.includes(query)
    const matchS = status === 'all' || o.status === status
    return matchQ && matchS
  })

  const totalRevenue = filtered
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.amount, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">주문 조회</h1>
        <p className="text-[14px] text-sand/40">
          총 {filtered.length}건 · 매출 ₩{totalRevenue.toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="주문번호, 이메일, 템플릿명 검색..."
            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-11 pr-4
                       text-[14px] text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors" />
        </div>
        <div className="flex gap-1 bg-[#111] border border-white/10 rounded-xl p-1">
          {[
            { v: 'all',       l: '전체' },
            { v: 'completed', l: '완료' },
            { v: 'pending',   l: '대기' },
            { v: 'refunded',  l: '환불' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                ${status === v ? 'bg-white/10 text-sand' : 'text-sand/40 hover:text-sand'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_80px_100px] gap-4 px-6 py-3 border-b border-white/[0.07]
                        text-[11px] text-sand/30 uppercase tracking-wider font-syne font-bold">
          <span>주문 / 템플릿</span><span>이메일</span><span>결제 수단</span><span>금액</span><span>상태</span><span>액션</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sand/30">
            <p className="text-2xl mb-2">:(</p>
            <p className="text-[13px]">검색 결과가 없어요</p>
          </div>
        ) : filtered.map((o, i) => (
          <div key={o.id}
            className={`grid grid-cols-[1.5fr_1fr_1fr_80px_80px_100px] gap-4 items-center px-6 py-4 text-[13px]
              ${i < filtered.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
            <div>
              <p className="font-medium truncate">{o.templates?.name ?? '—'}</p>
              <p className="text-[11px] text-sand/30 mt-0.5 font-mono">{o.order_number}</p>
            </div>
            <span className="text-sand/50 truncate text-[12px]">{o.user_email}</span>
            <span className="text-sand/50">{o.payment_method}</span>
            <span className={`font-syne font-bold ${o.amount > 0 ? 'text-lime' : 'text-sand/30'}`}>
              {o.amount > 0 ? `₩${o.amount.toLocaleString()}` : '무료'}
            </span>
            <span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status] ?? ''}`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </span>
            <div className="flex gap-1">
              {o.status === 'completed' && (
                <button onClick={() => updateStatus(o.id, 'refunded')}
                  className="text-[11px] text-[#ff5f3f]/60 border border-[#ff5f3f]/15 rounded-lg px-2 py-1 hover:text-[#ff5f3f] transition-colors cursor-pointer">
                  환불
                </button>
              )}
              {o.status === 'pending' && (
                <button onClick={() => updateStatus(o.id, 'completed')}
                  className="text-[11px] text-teal border border-teal/20 rounded-lg px-2 py-1 hover:opacity-75 transition-opacity cursor-pointer">
                  완료
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
