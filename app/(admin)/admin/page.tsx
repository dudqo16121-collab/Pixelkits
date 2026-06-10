'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Stats {
  thisMonthRevenue: number
  prevMonthRevenue: number
  thisMonthOrders:  number
  totalOrders:      number
  totalDownloads:   number
  avgRating:        number
  totalReviews:     number
}
interface MonthlyData  { month: string; revenue: number }
interface CategoryData { cat: string; count: number; pct: number }
interface RecentOrder  {
  id: string; order_number: string; template_name: string
  user_email: string; amount: number; payment_method: string; created_at: string
}

export default function AdminDashboard() {
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [monthly,      setMonthly]      = useState<MonthlyData[]>([])
  const [categories,   setCategories]   = useState<CategoryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading,      setLoading]      = useState(true)
  const [newOrderAlert,setNewOrderAlert]= useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchMonthly(), fetchCategories(), fetchRecentOrders()])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    // ── Realtime 구독 — 새 주문 알림 ──────────────────────
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrder = payload.new as any
          if (newOrder.status === 'completed') {
            setNewOrderAlert(`새 주문! #${newOrder.order_number} — ₩${(newOrder.amount ?? 0).toLocaleString()}`)
            setTimeout(() => setNewOrderAlert(null), 6000)
            // 통계 및 주문 목록 갱신
            await Promise.all([fetchStats(), fetchRecentOrders()])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  async function fetchStats() {
    const now            = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    const [thisMonth, prevMonth, total, downloads, reviews] = await Promise.all([
      supabase.from('orders').select('amount').eq('status', 'completed').gte('created_at', thisMonthStart),
      supabase.from('orders').select('amount').eq('status', 'completed').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'completed'),
      supabase.from('templates').select('download_count'),
      supabase.from('reviews').select('rating'),
    ])

    const thisRev   = (thisMonth.data ?? []).reduce((s, o) => s + o.amount, 0)
    const prevRev   = (prevMonth.data ?? []).reduce((s, o) => s + o.amount, 0)
    const totalDl   = (downloads.data ?? []).reduce((s, t) => s + (t.download_count ?? 0), 0)
    const ratings   = (reviews.data ?? []).map((r) => r.rating)
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : 0

    setStats({
      thisMonthRevenue: thisRev,
      prevMonthRevenue: prevRev,
      thisMonthOrders:  (thisMonth.data ?? []).length,
      totalOrders:      total.count ?? 0,
      totalDownloads:   totalDl,
      avgRating,
      totalReviews:     ratings.length,
    })
  }

  async function fetchMonthly() {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const { data } = await supabase
      .from('orders')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', sixMonthsAgo.toISOString())

    const map: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d   = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      (map as any)[`__label_${key}`] = `${d.getMonth() + 1}월`
      map[key] = 0
    }

    ;(data ?? []).forEach((o) => {
      const d   = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in map) map[key] += o.amount
    })

    const result: MonthlyData[] = Object.keys(map)
      .filter((k) => !k.startsWith('__label_'))
      .sort()
      .map((k) => ({ month: (map as any)[`__label_${k}`], revenue: map[k] }))

    setMonthly(result)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('orders')
      .select('templates(category)')
      .eq('status', 'completed')

    const catMap: Record<string, number> = {}
    ;(data ?? []).forEach((o: any) => {
      const cat = o.templates?.category ?? 'unknown'
      catMap[cat] = (catMap[cat] ?? 0) + 1
    })

    const total = Object.values(catMap).reduce((s, v) => s + v, 0)
    const LABELS: Record<string, string> = {
      landing: '랜딩페이지', saas: 'SaaS', portfolio: '포트폴리오',
      ecom: '쇼핑몰', dashboard: '대시보드', blog: '블로그',
    }

    setCategories(
      Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => ({
          cat: LABELS[cat] ?? cat,
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
    )
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, amount, payment_method, user_email, created_at, templates(name)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(8)

    setRecentOrders(
      (data ?? []).map((o: any) => ({
        id:             o.id,
        order_number:   o.order_number,
        template_name:  o.templates?.name ?? '—',
        user_email:     o.user_email,
        amount:         o.amount,
        payment_method: o.payment_method,
        created_at:     o.created_at,
      }))
    )
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const min  = Math.floor(diff / 60000)
    if (min < 60)  return `${min}분 전`
    const hr = Math.floor(min / 60)
    if (hr < 24)   return `${hr}시간 전`
    return `${Math.floor(hr / 24)}일 전`
  }

  const revenueChange = stats && stats.prevMonthRevenue > 0
    ? Math.round(((stats.thisMonthRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100)
    : null

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)

  return (
    <div className="p-8">

      {/* ── 실시간 새 주문 알림 ── */}
      {newOrderAlert && (
        <div className="fixed top-6 right-6 z-50 bg-lime text-ink font-syne font-bold
                        text-[13px] px-5 py-3 rounded-2xl shadow-2xl
                        flex items-center gap-2 animate-pulse">
          🛒 {newOrderAlert}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">대시보드</h1>
          <p className="text-[14px] text-sand/40">pixelkits 운영 현황</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="border border-white/10 rounded-xl px-4 py-2 text-[13px]
                     text-sand/50 hover:text-sand hover:border-white/25 transition-colors cursor-pointer
                     disabled:opacity-40">
          {loading ? '불러오는 중...' : '↻ 새로고침'}
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: '이번 달 매출',
            value: formatPrice(stats?.thisMonthRevenue ?? 0),
            sub:   revenueChange !== null
              ? `전월 대비 ${revenueChange >= 0 ? '+' : ''}${revenueChange}%`
              : '데이터 없음',
            color: 'text-lime',
          },
          {
            label: '이번 달 주문',
            value: `${stats?.thisMonthOrders ?? 0}건`,
            sub:   `누적 ${stats?.totalOrders ?? 0}건`,
            color: 'text-teal',
          },
          {
            label: '총 다운로드',
            value: `${stats?.totalDownloads ?? 0}회`,
            sub:   '전체 템플릿 합계',
            color: 'text-sand',
          },
          {
            label: '평균 평점',
            value: `★ ${stats?.avgRating ?? 0}`,
            sub:   `후기 ${stats?.totalReviews ?? 0}개`,
            color: 'text-lime',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#111] border border-white/[0.07] rounded-2xl p-5">
            <p className="text-[12px] text-sand/35 mb-2">{label}</p>
            <p className={`font-syne font-bold text-2xl mb-1 ${color}`}>{value}</p>
            <p className="text-[12px] text-sand/30">{sub}</p>
          </div>
        ))}
      </div>

      {/* 차트 + 카테고리 */}
      <div className="grid grid-cols-[1fr_280px] gap-4 mb-8">

        {/* 월별 매출 바 차트 */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-[14px] mb-6">최근 6개월 매출</h2>
          <div className="flex items-end gap-3 h-40">
            {monthly.map(({ month, revenue }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-[10px] text-sand/40">{revenue > 0 ? formatPrice(revenue) : ''}</p>
                <div className="w-full rounded-t-lg bg-lime/20 relative overflow-hidden"
                  style={{ height: `${Math.max((revenue / maxRevenue) * 120, 4)}px` }}>
                  <div className="absolute inset-0 bg-lime/60 rounded-t-lg" />
                </div>
                <p className="text-[11px] text-sand/40">{month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 매출 */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-[14px] mb-6">카테고리별 판매</h2>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-[13px] text-sand/30 text-center py-8">데이터가 없어요</p>
            ) : categories.map(({ cat, count, pct }) => (
              <div key={cat}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-sand/60">{cat}</span>
                  <span className="text-sand/40">{count}건</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-lime/60 rounded-full transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 주문 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-bold text-[14px]">최근 주문</h2>
          <Link href="/admin/orders"
            className="text-[12px] text-lime/70 hover:text-lime transition-colors">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_100px_80px] gap-4 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30 uppercase tracking-wider font-syne font-bold">
          <span>주문</span><span>이메일</span><span>결제수단</span><span>금액</span><span>시간</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-sand/30 text-[13px]">주문이 없어요</div>
        ) : recentOrders.map((o, i) => (
          <div key={o.id}
            className={`grid grid-cols-[1.6fr_1.2fr_1fr_100px_80px] gap-4 items-center
                        px-6 py-3.5 text-[13px]
                        ${i < recentOrders.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
            <div>
              <p className="font-mono text-[12px] text-sand/70">{o.order_number}</p>
              <p className="text-[11px] text-sand/30 truncate">{o.template_name}</p>
            </div>
            <span className="text-sand/50 text-[12px] truncate">{o.user_email}</span>
            <span className="text-sand/40 text-[12px]">
              {o.payment_method === 'card' ? '신용카드'
                : o.payment_method === 'tosspay' ? '토스페이'
                : o.payment_method === 'kakaopay' ? '카카오페이'
                : '무료'}
            </span>
            <span className="font-syne font-bold text-lime text-[13px]">
              {o.amount > 0 ? formatPrice(o.amount) : '무료'}
            </span>
            <span className="text-sand/30 text-[11px]">{timeAgo(o.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}