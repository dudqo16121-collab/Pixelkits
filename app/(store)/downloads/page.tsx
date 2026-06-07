'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'
import { useOrders } from '@/lib/useOrders'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

export default function DownloadsPage() {
  const pathname                = usePathname()
  const { userName, userEmail } = useUser()
  const { orders, loading, refreshing, refreshToken, incrementDownloadCount } = useOrders()
  const [downloading, setDownloading] = useState<string | null>(null)

  async function handleDownload(orderId: string, type: string) {
    setDownloading(orderId + type)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/download?orderId=${orderId}&type=${type}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.redirected) {
        if (type === 'source' || type === 'all') incrementDownloadCount(orderId)
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

  const initial = userName?.[0] ?? userEmail?.[0] ?? '?'

  return (
    <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-57px)]">
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

      <div className="p-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-2">다운로드</h1>
        <p className="text-[14px] text-sand/40 font-light mb-7">구매한 템플릿 파일을 다운로드하세요</p>

        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
            불러오는 중...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-20 text-sand/30">
            <p className="text-4xl mb-4">📁</p>
            <p className="text-[15px] mb-2">아직 다운로드 가능한 파일이 없어요</p>
            <Link href="/templates" className="btn-lime mt-4 inline-flex">템플릿 둘러보기</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const tmpl         = order.templates
              const isExpired    = new Date(order.token_expires_at) < new Date()
              const currentCount = order.download_count    ?? 0
              const maxCount     = order.max_download_count ?? 5
              const isExhausted  = currentCount >= maxCount

              const files = [
                { icon: '🗜', name: `${tmpl?.slug ?? 'template'}-v1.zip`, size: '소스코드 ZIP', type: 'source'  },
                { icon: '📄', name: '설치-가이드-한국어.pdf',              size: '설치 가이드',  type: 'guide'   },
                { icon: '📋', name: 'license.txt',                         size: '라이선스',     type: 'license' },
              ]

              return (
                <div key={order.id} className="card-base rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]
                                    border border-white/10 flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="font-syne font-bold text-[15px] mb-1">{tmpl?.name ?? '—'}</h2>
                      <div className="flex gap-3 text-[12px] text-sand/35 flex-wrap items-center">
                        <span>{formatDate(order.created_at)} 구매</span>
                        <span>·</span>
                        <span>#{order.order_number}</span>
                        <span>·</span>
                        <span className={isExpired ? 'text-[#ff5f3f]/70' : 'text-teal'}>
                          {isExpired ? '링크 만료됨' : `${formatDate(order.token_expires_at)}까지 유효`}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          isExhausted
                            ? 'text-[#ff5f3f]/70 border-[#ff5f3f]/20'
                            : 'text-sand/40 border-white/10'
                        }`}>
                          {currentCount}/{maxCount}회 사용
                        </span>
                      </div>
                    </div>
                    <span className="badge-lime text-[11px]">최신 버전</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {files.map(({ icon, name, size, type }) => {
                      const key        = order.id + type
                      const isDisabled = isExpired || (isExhausted && type === 'source')
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
                          {isDisabled ? (
                            <span className="text-[12px] text-sand/25 px-3 py-1.5">
                              {isExpired ? '만료됨' : '횟수 초과'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDownload(order.id, type)}
                              disabled={downloading === key}
                              className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5
                                         rounded-lg hover:opacity-85 transition-opacity cursor-pointer
                                         disabled:opacity-50">
                              {downloading === key ? '...' : '⬇ 다운로드'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    {(isExpired || isExhausted) ? (
                      <button
                        onClick={() => refreshToken(order.id)}
                        disabled={refreshing === order.id}
                        className="btn-lime text-[13px] px-5 py-2.5 disabled:opacity-50">
                        {refreshing === order.id ? '재발급 중...' : '↻ 링크 재발급 (72시간 · 5회)'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(order.id, 'all')}
                        disabled={downloading === order.id + 'all'}
                        className="btn-lime text-[13px] px-5 py-2.5 disabled:opacity-50">
                        {downloading === order.id + 'all' ? '⏳ 준비중...' : '⬇ 전체 파일 받기'}
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