'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

export default function DownloadsPage() {
  const pathname = usePathname()
  const router   = useRouter()
  const { userId, userName, userEmail } = useUser()

  const [orders,     setOrders]     = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [refreshing,  setRefreshing]  = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return
    if (!userId) { router.push('/login'); return }

    supabase
      .from('orders')
      .select(`
        id, order_number, download_token, token_expires_at, created_at,
        templates ( name, slug, stack )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [userId])

  // 파일 다운로드 — API Route로 Signed URL 발급 후 리다이렉트
  async function handleDownload(token: string, type: string) {
    setDownloading(token + type)
    try {
      const res = await fetch(`/api/download?token=${token}&type=${type}`)
      if (res.redirected) {
        window.location.href = res.url
        return
      }
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '다운로드에 실패했어요')
      }
    } finally {
      setDownloading(null)
    }
  }

  // 토큰 재발급
  async function handleRefreshToken(orderId: string) {
    setRefreshing(orderId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/download/refresh', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }

      setOrders((prev) => prev.map((o) =>
        o.id === orderId
          ? { ...o, download_token: data.downloadToken, token_expires_at: data.tokenExpiresAt }
          : o
      ))
    } finally {
      setRefreshing(null)
    }
  }

  const initial = userName?.[0] ?? userEmail?.[0] ?? '?'

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
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-2">다운로드</h1>
        <p className="text-[14px] text-sand/40 font-light mb-7">구매한 템플릿 파일을 다운로드하세요</p>

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
            <p className="text-4xl mb-4">📁</p>
            <p className="text-[15px] mb-2">아직 다운로드 가능한 파일이 없어요</p>
            <Link href="/templates" className="btn-lime mt-4 inline-flex">템플릿 둘러보기</Link>
          </div>
        )}

        {/* 주문별 다운로드 카드 */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const tmpl      = order.templates
              const isExpired = new Date(order.token_expires_at) < new Date()

              const files = [
                { icon: '🗜', name: `${tmpl?.slug ?? 'template'}-v1.zip`, size: '4.8 MB', type: 'source'  },
                { icon: '📄', name: '설치-가이드-한국어.pdf',              size: '1.1 MB', type: 'guide'   },
                { icon: '📋', name: 'license.txt',                         size: '12 KB',  type: 'license' },
              ]

              return (
                <div key={order.id} className="card-base rounded-2xl p-6">

                  {/* 상단 정보 */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                                    border border-white/10 flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="font-syne font-bold text-[15px] mb-1">{tmpl?.name ?? '—'}</h2>
                      <div className="flex gap-3 text-[12px] text-sand/35 flex-wrap">
                        <span>{formatDate(order.created_at)} 구매</span>
                        <span>·</span>
                        <span>#{order.order_number}</span>
                        <span>·</span>
                        <span className={isExpired ? 'text-[#ff5f3f]/70' : 'text-teal'}>
                          {isExpired
                            ? '링크 만료됨'
                            : `${formatDate(order.token_expires_at)}까지 유효`}
                        </span>
                      </div>
                    </div>
                    <span className="badge-lime text-[11px]">최신 버전</span>
                  </div>

                  {/* 파일 목록 */}
                  <div className="space-y-2 mb-4">
                    {files.map(({ icon, name, size, type }) => {
                      const key = order.download_token + type
                      return (
                        <div key={type}
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                          <div className="w-8 h-8 rounded-lg bg-lime/[0.08] border border-lime/15
                                          flex items-center justify-center flex-shrink-0 text-sm">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">{name}</p>
                            <p className="text-[11px] text-sand/30">{size}</p>
                          </div>
                          {isExpired ? (
                            <span className="text-[12px] text-sand/25 px-3 py-1.5">만료됨</span>
                          ) : (
                            <button
                              onClick={() => handleDownload(order.download_token, type)}
                              disabled={downloading === key}
                              className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5
                                         rounded-lg hover:opacity-85 transition-opacity cursor-pointer
                                         disabled:opacity-50"
                            >
                              {downloading === key ? '...' : '⬇ 다운로드'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* 하단 버튼 */}
                  <div className="flex gap-2">
                    {isExpired ? (
                      <button
                        onClick={() => handleRefreshToken(order.id)}
                        disabled={refreshing === order.id}
                        className="btn-lime text-[13px] px-5 py-2.5 disabled:opacity-50"
                      >
                        {refreshing === order.id ? '재발급 중...' : '↻ 링크 재발급 (72시간)'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(order.download_token, 'all')}
                        disabled={downloading === order.download_token + 'all'}
                        className="btn-lime text-[13px] px-5 py-2.5 disabled:opacity-50"
                      >
                        {downloading === order.download_token + 'all' ? '⏳ 준비중...' : '⬇ 전체 파일 받기'}
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}