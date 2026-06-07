'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserRow {
  id:          string
  email:       string
  name:        string | null
  is_admin:    boolean
  created_at:  string
  order_count: number
  total_spent: number
}

export default function AdminUsersPage() {
  const [users,        setUsers]        = useState<UserRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [query,        setQuery]        = useState('')
  const [selected,     setSelected]     = useState<UserRow | null>(null)
  const [orders,       setOrders]       = useState<any[]>([])
  const [loadingOrders,setLoadingOrders]= useState(false)
  const [togglingId,   setTogglingId]   = useState<string | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const data = await res.json()
    if (res.ok) setUsers(data.users ?? [])
    setLoading(false)
  }

  async function openDetail(user: UserRow) {
    setSelected(user)
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, amount, status, created_at, templates(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoadingOrders(false)
  }

  async function toggleAdmin(user: UserRow) {
    setTogglingId(user.id)
    const next = !user.is_admin
    await supabase.from('profiles').upsert({ id: user.id, is_admin: next })
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: next } : u))
    if (selected?.id === user.id) setSelected({ ...user, is_admin: next })
    setTogglingId(null)
  }

  const filtered = users.filter((u) =>
    !query ||
    u.email?.includes(query) ||
    (u.name ?? '').includes(query)
  )

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return '오늘'
    if (days < 30)  return `${days}일 전`
    if (days < 365) return `${Math.floor(days / 30)}개월 전`
    return `${Math.floor(days / 365)}년 전`
  }

  return (
    <div className="p-8">

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">회원 관리</h1>
        <p className="text-[14px] text-sand/40">총 {users.length}명</p>
      </div>

      {/* 검색 */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이메일, 이름 검색..."
          className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-11 pr-4
                     text-[14px] text-sand placeholder:text-sand/20
                     outline-none focus:border-lime/40 transition-colors"
        />
      </div>

      {/* 테이블 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_160px] gap-4 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30
                        uppercase tracking-wider font-syne font-bold">
          <span>회원</span>
          <span>가입일</span>
          <span>구매 수</span>
          <span>총 결제</span>
          <span>액션</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sand/30 text-[13px]">
            {query ? '검색 결과가 없어요' : '회원이 없어요'}
          </div>
        ) : filtered.map((u, i) => (
          <div key={u.id}
            className={`grid grid-cols-[2fr_1fr_1fr_1fr_160px] gap-4 items-center
                        px-6 py-4 text-[13px]
                        ${i < filtered.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>

            {/* 회원 정보 */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-lime/12 border border-lime/25
                              flex items-center justify-center font-syne font-bold
                              text-lime text-[12px] flex-shrink-0">
                {u.name?.[0] ?? u.email?.[0] ?? '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium truncate">{u.name ?? '이름 없음'}</p>
                  {u.is_admin && (
                    <span className="text-[10px] font-bold bg-lime/10 border border-lime/20
                                     text-lime px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-sand/35 truncate">{u.email}</p>
              </div>
            </div>

            {/* 가입일 */}
            <span className="text-sand/40 text-[12px]">{timeAgo(u.created_at)}</span>

            {/* 구매 수 */}
            <span className="text-sand/60 text-[12px]">{u.order_count}건</span>

            {/* 총 결제 */}
            <span className={`font-syne font-bold text-[13px] ${u.total_spent > 0 ? 'text-lime' : 'text-sand/25'}`}>
              {u.total_spent > 0 ? `₩${u.total_spent.toLocaleString()}` : '—'}
            </span>

            {/* 액션 */}
            <div className="flex gap-1.5">
              <button
                onClick={() => openDetail(u)}
                className="text-[11px] text-sand/50 border border-white/10 rounded-lg
                           px-2.5 py-1.5 hover:text-sand hover:border-white/25
                           transition-colors cursor-pointer">
                상세
              </button>
              <button
                onClick={() => toggleAdmin(u)}
                disabled={togglingId === u.id}
                className={`text-[11px] border rounded-lg px-2.5 py-1.5
                            transition-colors cursor-pointer disabled:opacity-40
                  ${u.is_admin
                    ? 'text-lime/60 border-lime/20 hover:text-[#ff5f3f]/70 hover:border-[#ff5f3f]/20'
                    : 'text-sand/30 border-white/10 hover:text-lime hover:border-lime/25'}`}>
                {togglingId === u.id ? '...' : u.is_admin ? '관리자 해제' : '관리자 지정'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 회원 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg
                          shadow-2xl flex flex-col max-h-[85vh]">

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-lime/12 border border-lime/25
                                flex items-center justify-center font-syne font-bold text-lime">
                  {selected.name?.[0] ?? selected.email?.[0] ?? '?'}
                </div>
                <div>
                  <p className="font-syne font-bold text-[15px]">{selected.name ?? '이름 없음'}</p>
                  <p className="text-[12px] text-sand/40">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-sand/30 hover:text-sand transition-colors cursor-pointer text-xl leading-none">
                ✕
              </button>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
              {[
                { label: '구매 수', value: `${selected.order_count}건` },
                { label: '총 결제', value: selected.total_spent > 0 ? `₩${selected.total_spent.toLocaleString()}` : '—' },
                { label: '권한',   value: selected.is_admin ? '관리자' : '일반 회원' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[11px] text-sand/35 mb-1">{label}</p>
                  <p className="text-[13px] font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* 구매 내역 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="font-syne font-bold text-[12px] text-sand/30 uppercase tracking-wider mb-3">
                구매 내역
              </p>
              {loadingOrders ? (
                <div className="flex justify-center py-8 text-sand/30">
                  <div className="w-4 h-4 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-[13px] text-sand/30 text-center py-8">구매 내역이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06]
                                 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{o.templates?.name ?? '—'}</p>
                        <p className="text-[11px] text-sand/35 font-mono">#{o.order_number}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
                        ${o.status === 'completed'
                          ? 'bg-teal/10 text-teal border-teal/20'
                          : o.status === 'refunded'
                          ? 'bg-[#ff5f3f]/10 text-[#ff5f3f] border-[#ff5f3f]/20'
                          : 'bg-white/[0.05] text-sand/40 border-white/10'}`}>
                        {o.status === 'completed' ? '완료' : o.status === 'refunded' ? '환불' : o.status}
                      </span>
                      <span className="font-syne font-bold text-[13px] text-lime flex-shrink-0">
                        {o.amount > 0 ? `₩${o.amount.toLocaleString()}` : '무료'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex gap-2 px-6 pb-5 pt-3 border-t border-white/[0.07] flex-shrink-0">
              <button
                onClick={() => toggleAdmin(selected)}
                disabled={togglingId === selected.id}
                className={`flex-1 border rounded-xl py-2.5 text-[13px] font-medium
                            transition-colors cursor-pointer disabled:opacity-40
                  ${selected.is_admin
                    ? 'text-[#ff5f3f]/70 border-[#ff5f3f]/20 hover:border-[#ff5f3f]/40'
                    : 'text-lime border-lime/25 hover:border-lime/40'}`}>
                {togglingId === selected.id ? '처리 중...' : selected.is_admin ? '관리자 권한 해제' : '관리자로 지정'}
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl py-2.5
                           text-[13px] text-sand/60 hover:text-sand transition-colors cursor-pointer">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}