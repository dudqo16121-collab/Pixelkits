'use client'
import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Stats {
  thisMonthRevenue: number
  prevMonthRevenue: number
  thisMonthOrders: number
  totalOrders: number
  totalDownloads: number
  avgRating: number
  totalReviews: number
}

interface MonthlyData { month: string; revenue: number }
interface CategoryData { cat: string; count: number; pct: number }
interface RecentOrder {
  id: string; order_number: string; template_name: string
  user_email: string; amount: number; payment_method: string; created_at: string
}

export default function AdminDashboard() {
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [monthly,      setMonthly]      = useState<MonthlyData[]>([])
  const [categories,   setCategories]   = useState<CategoryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchStats(), fetchMonthly(), fetchCategories(), fetchRecentOrders()])
    setLoading(false)
  }

  async function fetchStats() {
    const now = new Date()
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

    const thisRev  = (thisMonth.data ?? []).reduce((s, o) => s + o.amount, 0)
    const prevRev  = (prevMonth.data ?? []).reduce((s, o) => s + o.amount, 0)
    const totalDl  = (downloads.data ?? []).reduce((s, t) => s + (t.download_count ?? 0), 0)
    const ratings  = (reviews.data ?? []).map((r) => r.rating)
    const avgRating = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : 0

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
    // 최근 6개월 주문 데이터
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const { data } = await supabase
      .from('orders')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', sixMonthsAgo.toISOString())

    // 월별 그룹핑
    const map: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}월`
      map[key] = 0
      // label 저장용 (순서 보장)
      ;(map as any)[`__label_${key}`] = label
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

    const result: CategoryData[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({
        cat: LABELS[cat] ?? cat,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))

    setCategories(result)
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, user_email, amount, payment_method, created_at, templates(name)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

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

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)

  const revGrowth = stats && stats.prevMonthRevenue > 0
    ? Math.round(((stats.thisMonthRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100)
    : null

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-sand/30">
      <div className="w-6 h-6 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-3" />
      불러오는 중...
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">대시보드</h1>
        <p className="text-[14px] text-sand/40">pixelkits 운영 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: '이번 달 매출',
            value: formatPrice(stats?.thisMonthRevenue ?? 0),
            sub: revGrowth !== null
              ? `전월 대비 ${revGrowth >= 0 ? '+' : ''}${revGrowth}%`
              : '데이터 없음',
            color: 'text-lime',
          },
          {
            label: '총 주문 수',
            value: `${stats?.totalOrders ?? 0}건`,
            sub: `이번 달 ${stats?.thisMonthOrders ?? 0}건`,
            color: 'text-sand',
          },
          {
            label: '총 다운로드',
            value: `${(stats?.totalDownloads ?? 0).toLocaleString()}회`,
            sub: '누적',
            color: 'text-teal',
          },
          {
            label: '평균 평점',
            value: stats?.avgRating ? `${stats.avgRating} ★` : '—',
            sub: `${stats?.totalReviews ?? 0}개 후기 기준`,
            color: 'text-sand',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#111] border border-white/[0.07] rounded-2xl p-5">
            <p className="text-[12px] text-sand/35 mb-2">{label}</p>
            <p className={`font-syne font-bold text-2xl mb-1 ${color}`}>{value}</p>
            <p className="text-[11px] text-sand/25">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 mb-5">
        {/* 월별 매출 차트 */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-[15px] mb-6">월별 매출</h2>
          {monthly.length === 0 ? (
            <p className="text-[13px] text-sand/30 py-8 text-center">데이터가 없어요</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthly.map(({ month, revenue }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] text-sand/40">
                    {revenue > 0 ? `₩${(revenue / 10000).toFixed(0)}만` : '—'}
                  </span>
                  <div
                    className="w-full bg-lime/80 rounded-t-md transition-all"
                    style={{ height: `${(revenue / maxRevenue) * 120}px`, minHeight: revenue > 0 ? '4px' : '0' }}
                  />
                  <span className="text-[11px] text-sand/40">{month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리별 판매 */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-[15px] mb-6">카테고리별 판매</h2>
          {categories.length === 0 ? (
            <p className="text-[13px] text-sand/30 py-8 text-center">데이터가 없어요</p>
          ) : (
            <div className="space-y-3">
              {categories.map(({ cat, count, pct }) => (
                <div key={cat}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-sand/60">{cat}</span>
                    <span className="text-sand/40">{count}건 ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-lime/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 주문 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-bold text-[15px]">최근 주문</h2>
          <Link href="/admin/orders" className="text-[12px] text-lime hover:opacity-75 transition-opacity">
            전체 보기 →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-sand/30 text-[13px]">아직 주문이 없어요</div>
        ) : recentOrders.map((order, i) => (
          <div key={order.id}
            className={`flex items-center gap-4 px-6 py-4 text-[13px]
              ${i < recentOrders.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{order.template_name}</p>
              <p className="text-sand/35 text-[11px] mt-0.5">{order.user_email}</p>
            </div>
            <span className="text-sand/30 text-[11px] font-mono hidden lg:block">{order.order_number}</span>
            <span className="text-sand/40 text-[11px]">{order.payment_method}</span>
            <span className="font-syne font-bold text-lime">₩{order.amount.toLocaleString()}</span>
            <span className="text-sand/30 text-[11px] w-14 text-right">{timeAgo(order.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}