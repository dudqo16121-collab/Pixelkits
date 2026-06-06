'use client'

const STATS = [
  { label: '이번 달 매출',  value: '₩1,240,000', sub: '전월 대비 +23%',  color: 'text-lime'  },
  { label: '총 주문 수',    value: '89건',         sub: '이번 달 +12건',  color: 'text-sand'  },
  { label: '총 다운로드',   value: '4,821회',      sub: '누적',           color: 'text-teal'  },
  { label: '평균 평점',     value: '4.9 ★',       sub: '68개 후기 기준', color: 'text-sand'  },
]

const RECENT_ORDERS = [
  { id: 'PKT-20260605-8821', template: 'Lumina SaaS Kit',  email: 'user1@gmail.com', amount: 29000, method: '카드',     time: '10분 전'  },
  { id: 'PKT-20260605-7741', template: 'Astra Landing',    email: 'user2@naver.com', amount: 19000, method: '토스페이', time: '1시간 전' },
  { id: 'PKT-20260604-9921', template: 'Nova Portfolio',   email: 'user3@kakao.com', amount: 25000, method: '카카오',   time: '어제'     },
  { id: 'PKT-20260604-8810', template: 'Pulse Dashboard',  email: 'user4@gmail.com', amount: 42000, method: '카드',     time: '어제'     },
  { id: 'PKT-20260603-7723', template: 'Ember Shop',       email: 'user5@gmail.com', amount: 38000, method: '카드',     time: '2일 전'   },
]

const MONTHLY = [
  { month: '1월', revenue: 480000  },
  { month: '2월', revenue: 620000  },
  { month: '3월', revenue: 550000  },
  { month: '4월', revenue: 890000  },
  { month: '5월', revenue: 1010000 },
  { month: '6월', revenue: 1240000 },
]

export default function AdminDashboard() {
  const max = Math.max(...MONTHLY.map((m) => m.revenue))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">대시보드</h1>
        <p className="text-[14px] text-sand/40">pixelkits 운영 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, sub, color }) => (
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
          <div className="flex items-end gap-3 h-40">
            {MONTHLY.map(({ month, revenue }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] text-sand/40">₩{(revenue / 10000).toFixed(0)}만</span>
                <div className="w-full bg-lime/80 rounded-t-md transition-all"
                  style={{ height: `${(revenue / max) * 120}px` }} />
                <span className="text-[11px] text-sand/40">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 판매 */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="font-syne font-bold text-[15px] mb-6">카테고리별 판매</h2>
          <div className="space-y-3">
            {[
              { cat: 'SaaS',       count: 34, pct: 38 },
              { cat: '랜딩페이지', count: 28, pct: 31 },
              { cat: '포트폴리오', count: 15, pct: 17 },
              { cat: '쇼핑몰',     count: 8,  pct: 9  },
              { cat: '대시보드',   count: 4,  pct: 5  },
            ].map(({ cat, count, pct }) => (
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
        </div>
      </div>

      {/* 최근 주문 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-bold text-[15px]">최근 주문</h2>
          <a href="/admin/orders" className="text-[12px] text-lime hover:opacity-75 transition-opacity">
            전체 보기 →
          </a>
        </div>
        {RECENT_ORDERS.map((order, i) => (
          <div key={order.id}
            className={`flex items-center gap-4 px-6 py-4 text-[13px]
              ${i < RECENT_ORDERS.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{order.template}</p>
              <p className="text-sand/35 text-[11px] mt-0.5">{order.email}</p>
            </div>
            <span className="text-sand/30 text-[11px] font-mono hidden lg:block">{order.id}</span>
            <span className="text-sand/40 text-[11px]">{order.method}</span>
            <span className="font-syne font-bold text-lime">₩{order.amount.toLocaleString()}</span>
            <span className="text-sand/30 text-[11px] w-14 text-right">{order.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
