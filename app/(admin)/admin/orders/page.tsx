'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  user_email: string
  amount: number
  refunded_amount: number
  payment_method: string
  payment_key: string | null
  status: string
  created_at: string
  templates?: { name: string }
}

const STATUS_STYLE: Record<string, string> = {
  completed:      'bg-teal/12 text-teal border-teal/20',
  partial_refund: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  refunded:       'bg-[#ff5f3f]/12 text-[#ff5f3f] border-[#ff5f3f]/20',
  pending:        'bg-white/[0.07] text-sand/50 border-white/15',
  failed:         'bg-white/[0.07] text-sand/40 border-white/10',
}
const STATUS_LABEL: Record<string, string> = {
  completed:      '완료',
  partial_refund: '부분환불',
  refunded:       '전액환불',
  pending:        '대기',
  failed:         '실패',
}

// ── 환불 모달 ─────────────────────────────────────────────
function RefundModal({
  order,
  onClose,
  onDone,
}: {
  order: Order
  onClose: () => void
  onDone:  () => void
}) {
  const alreadyRefunded = order.refunded_amount ?? 0
  const maxRefundable   = order.amount - alreadyRefunded

  const [mode,   setMode]   = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading,setLoading]= useState(false)

  const cancelAmount = mode === 'full'
    ? maxRefundable
    : Math.min(Number(amount) || 0, maxRefundable)

  async function handleSubmit() {
    if (!reason.trim()) { alert('환불 사유를 입력해주세요'); return }
    if (mode === 'partial' && (!amount || Number(amount) <= 0)) {
      alert('환불 금액을 입력해주세요'); return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orderId:      order.id,
          reason,
          refundAmount: mode === 'partial' ? Number(amount) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { alert('환불 실패: ' + data.error); return }

      alert(
        `환불 완료!\n` +
        `이번 환불: ₩${data.cancelAmount.toLocaleString()}\n` +
        `${data.isFullRefund ? '전액 환불 완료' : `잔여 금액: ₩${data.remainingAmount.toLocaleString()}`}`
      )
      onDone()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-bold text-[16px]">환불 처리</h2>
          <button onClick={onClose}
            className="text-sand/30 hover:text-sand transition-colors cursor-pointer text-xl leading-none">
            ✕
          </button>
        </div>

        {/* 주문 정보 */}
        <div className="px-6 pt-5 pb-1">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-[13px] space-y-2 mb-5">
            <div className="flex justify-between">
              <span className="text-sand/40">주문번호</span>
              <span className="font-mono text-sand/70">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sand/40">이메일</span>
              <span className="text-sand/70">{order.user_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sand/40">결제 금액</span>
              <span className="font-syne font-bold text-lime">₩{order.amount.toLocaleString()}</span>
            </div>
            {alreadyRefunded > 0 && (
              <div className="flex justify-between">
                <span className="text-sand/40">이미 환불</span>
                <span className="text-[#ff5f3f]">-₩{alreadyRefunded.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.06] pt-2 mt-2">
              <span className="text-sand/40">환불 가능</span>
              <span className="font-syne font-bold text-sand">₩{maxRefundable.toLocaleString()}</span>
            </div>
          </div>

          {/* 환불 유형 */}
          <div className="mb-4">
            <p className="text-[12px] text-sand/45 mb-2 font-medium">환불 유형</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: 'full',    l: '전액 환불', sub: `₩${maxRefundable.toLocaleString()} 전액` },
                { v: 'partial', l: '부분 환불', sub: '금액 직접 입력'                           },
              ] as const).map(({ v, l, sub }) => (
                <button key={v} onClick={() => setMode(v)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer
                    ${mode === v
                      ? 'border-lime/40 bg-lime/[0.06]'
                      : 'border-white/10 hover:border-white/20'}`}>
                  <p className={`text-[13px] font-medium ${mode === v ? 'text-lime' : 'text-sand'}`}>{l}</p>
                  <p className="text-[11px] text-sand/35 mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 부분 환불 금액 입력 */}
          {mode === 'partial' && (
            <div className="mb-4">
              <p className="text-[12px] text-sand/45 mb-1.5 font-medium">
                환불 금액 <span className="text-sand/25 font-normal">(최대 ₩{maxRefundable.toLocaleString()})</span>
              </p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ex) 15000"
                max={maxRefundable}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5
                           text-[13px] text-sand placeholder:text-sand/20 outline-none
                           focus:border-lime/40 transition-colors"
              />
              {Number(amount) > 0 && (
                <p className="text-[11px] text-sand/30 mt-1">
                  환불 후 잔여: ₩{Math.max(0, maxRefundable - Number(amount)).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* 환불 사유 */}
          <div className="mb-5">
            <p className="text-[12px] text-sand/45 mb-1.5 font-medium">환불 사유 *</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="고객 요청 환불 / 기술적 결함 / 단순 변심 등"
              rows={3}
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5
                         text-[13px] text-sand placeholder:text-sand/20 outline-none
                         focus:border-lime/40 transition-colors resize-none"
            />
          </div>

          {/* 환불 예정 금액 */}
          <div className="bg-[#ff5f3f]/[0.06] border border-[#ff5f3f]/15 rounded-xl px-4 py-3 mb-5">
            <div className="flex justify-between text-[13px]">
              <span className="text-sand/50">환불 예정 금액</span>
              <span className="font-syne font-bold text-[#ff5f3f]">
                ₩{cancelAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 border border-white/10 rounded-xl py-2.5 text-[13px]
                       text-sand/50 hover:text-sand transition-colors cursor-pointer">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || cancelAmount <= 0}
            className="flex-1 bg-[#ff5f3f] text-white font-bold rounded-xl py-2.5
                       text-[13px] hover:opacity-85 transition-opacity cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? '처리 중...' : `₩${cancelAmount.toLocaleString()} 환불`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders,       setOrders]       = useState<Order[]>([])
  const [loading,      setLoading]      = useState(true)
  const [query,        setQuery]        = useState('')
  const [status,       setStatus]       = useState('all')
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)

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

  async function markCompleted(id: string) {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
    await fetchOrders()
  }

  const filtered = orders.filter((o) => {
    const matchQ =
      !query ||
      o.order_number?.includes(query) ||
      o.user_email?.includes(query) ||
      (o.templates?.name ?? '').includes(query)
    const matchS = status === 'all' || o.status === status
    return matchQ && matchS
  })

  const totalRevenue = filtered
    .filter((o) => o.status === 'completed' || o.status === 'partial_refund')
    .reduce((s, o) => s + o.amount - (o.refunded_amount ?? 0), 0)

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
          총 {filtered.length}건 · 실 매출 ₩{totalRevenue.toLocaleString()}
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
            { v: 'all',            l: '전체'   },
            { v: 'completed',      l: '완료'   },
            { v: 'partial_refund', l: '부분환불'},
            { v: 'pending',        l: '대기'   },
            { v: 'refunded',       l: '환불'   },
            { v: 'failed',         l: '실패'   },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                ${status === v ? 'bg-white/10 text-sand' : 'text-sand/40 hover:text-sand'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1.8fr_1.2fr_1fr_90px_110px_160px] gap-4 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30
                        uppercase tracking-wider font-syne font-bold">
          <span>주문</span>
          <span>이메일</span>
          <span>결제수단</span>
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
            <p className="text-3xl mb-3">🧾</p>
            <p className="text-[13px]">{query ? '검색 결과가 없어요' : '주문이 없어요'}</p>
          </div>
        ) : (
          filtered.map((o, i) => (
            <div key={o.id}
              className={`grid grid-cols-[1.8fr_1.2fr_1fr_90px_110px_160px] gap-4 items-center
                          px-6 py-4 text-[13px]
                          ${i < filtered.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>

              {/* 주문 정보 */}
              <div>
                <p className="font-mono text-[12px] text-sand/70">{o.order_number}</p>
                <p className="text-[11px] text-sand/30 mt-0.5">
                  {o.templates?.name ?? '—'} · {timeAgo(o.created_at)}
                </p>
              </div>

              {/* 이메일 */}
              <span className="text-sand/60 text-[12px] truncate">{o.user_email}</span>

              {/* 결제수단 */}
              <span className="text-sand/50 text-[12px]">
                {o.payment_method === 'card'     ? '신용카드'
                : o.payment_method === 'tosspay'  ? '토스페이'
                : o.payment_method === 'kakaopay' ? '카카오페이'
                : o.payment_method === 'free'     ? '무료'
                : o.payment_method}
              </span>

              {/* 금액 */}
              <div>
                <span className={`font-syne font-bold block ${o.amount > 0 ? 'text-lime' : 'text-sand/30'}`}>
                  {o.amount > 0 ? `₩${o.amount.toLocaleString()}` : '무료'}
                </span>
                {(o.refunded_amount ?? 0) > 0 && (
                  <span className="text-[11px] text-[#ff5f3f]/70">
                    -₩{o.refunded_amount.toLocaleString()}
                  </span>
                )}
              </div>

              {/* 상태 */}
              <span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
                  ${STATUS_STYLE[o.status] ?? 'text-sand/40 border-white/10'}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </span>

              {/* 액션 */}
              <div className="flex gap-1.5">
                {(o.status === 'completed' || o.status === 'partial_refund') && (
                  <button
                    onClick={() => setRefundTarget(o)}
                    className="text-[11px] text-[#ff5f3f]/60 border border-[#ff5f3f]/15
                               rounded-lg px-2.5 py-1.5 hover:text-[#ff5f3f]
                               hover:border-[#ff5f3f]/30 transition-colors cursor-pointer">
                    환불
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
                  <span className="text-[11px] text-sand/25">전액환불</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 환불 모달 */}
      {refundTarget && (
        <RefundModal
          order={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={async () => {
            setRefundTarget(null)
            await fetchOrders()
          }}
        />
      )}
    </div>
  )
}