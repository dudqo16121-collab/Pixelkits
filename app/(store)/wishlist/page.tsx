'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { getWishlist, removeWish } from '@/lib/wishlist'
import { useUser } from '@/lib/UserContext'
import type { Template } from '@/types'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

export default function WishlistPage() {
  const pathname = usePathname()
  const router   = useRouter()
  const { userId, userName, userEmail } = useUser()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading,   setLoading]   = useState(true)
  const [removing,  setRemoving]  = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return
    if (!userId) { router.push('/login'); return }

    getWishlist(userId).then((data) => {
      setTemplates(data)
      setLoading(false)
    })
  }, [userId])

  async function handleRemove(templateId: string) {
    if (!userId) return
    setRemoving(templateId)
    await removeWish(userId, templateId)
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    setRemoving(null)
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
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">찜한 템플릿</h1>
            <p className="text-[14px] text-sand/40 font-light">
              <span className="text-sand font-medium">{templates.length}</span>개 저장됨
            </p>
          </div>
          <Link href="/templates" className="btn-ghost text-[13px] px-4 py-2">
            + 더 둘러보기
          </Link>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
            불러오는 중...
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-24 text-sand/30">
            <p className="text-5xl mb-4">♡</p>
            <p className="text-[15px] mb-2">아직 찜한 템플릿이 없어요</p>
            <p className="text-[13px] mb-6">마음에 드는 템플릿을 찜해보세요</p>
            <Link href="/templates" className="btn-lime">템플릿 둘러보기</Link>
          </div>
        )}

        {/* 찜 목록 */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="relative group">

                {/* 찜 해제 버튼 */}
                <button
                  onClick={() => handleRemove(t.id)}
                  disabled={removing === t.id}
                  className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full
                             bg-black/50 border border-white/10 flex items-center justify-center
                             text-[#ff5f3f] text-[13px] opacity-0 group-hover:opacity-100
                             transition-opacity cursor-pointer hover:bg-black/70 disabled:opacity-50">
                  {removing === t.id ? '…' : '♥'}
                </button>

                <Link href={`/templates/${t.slug}`}
                  className="card-base rounded-2xl overflow-hidden block
                             hover:-translate-y-1 transition-transform duration-200
                             hover:border-white/[0.18]">

                  {/* 썸네일 */}
                  <div className="h-36 bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] relative overflow-hidden">
                    {t.thumbnail_url ? (
                      <img src={t.thumbnail_url} alt={t.name}
                        className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[82%] h-[78%] bg-white/[0.04] border border-white/[0.09] rounded-md overflow-hidden flex flex-col">
                          <div className="h-4 bg-white/[0.05] flex items-center gap-1 px-2">
                            {['#ff5f57','#febc2e','#28c840'].map((c) => (
                              <span key={c} className="w-[5px] h-[5px] rounded-full" style={{ background: c }} />
                            ))}
                          </div>
                          <div className="flex-1 p-2 flex flex-col gap-1">
                            <div className="h-5 bg-white/[0.07] rounded" />
                            <div className="flex gap-1 flex-1">
                              <div className="flex-1 bg-white/[0.05] rounded" />
                              <div className="flex-1 bg-white/[0.05] rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {t.badge && (
                      <span className={`absolute top-2 right-2 text-[10px] font-syne font-bold
                                       px-2 py-0.5 rounded-full
                        ${t.badge === 'hot' ? 'bg-[#ff5f3f] text-white'
                          : t.badge === 'new' ? 'bg-teal text-[#04342c]'
                          : 'bg-lime text-ink'}`}>
                        {t.badge.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="p-3 pb-4">
                    <p className="text-[10px] text-sand/30 uppercase tracking-[0.8px] mb-1">{t.category}</p>
                    <h3 className="font-syne font-bold text-[13px] mb-2 leading-snug">{t.name}</h3>
                    <div className="flex gap-1 flex-wrap mb-2">
                      {t.stack?.map((s) => (
                        <span key={s} className="text-[10px] text-sand/35 bg-white/[0.05] rounded px-1.5 py-0.5">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-lime">{formatPrice(t.price)}</span>
                      <span className="text-[11px] text-sand/30">★ {t.rating}</span>
                    </div>
                  </div>
                </Link>

                {/* 구매 버튼 (hover) */}
                <div className="absolute bottom-0 left-0 right-0 p-2
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/checkout?template=${t.slug}`}
                    className="btn-lime w-full justify-center py-2 text-[12px] rounded-xl">
                    지금 구매 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}