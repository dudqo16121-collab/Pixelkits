'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { useUser } from '@/lib/UserContext'

const NAV_LINKS = [
  { href: '/templates', label: '템플릿' },
  { href: '/about',     label: '소개'   },
  { href: '/faq',       label: 'FAQ'    },
]

export function Navbar() {
  const pathname                    = usePathname()
  const router                      = useRouter()
  const { userName, userEmail, refreshUser, isAdmin } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const isLoggedIn  = !!userEmail
  const userInitial = userName?.[0] ?? userEmail?.[0] ?? '?'

  async function handleSignOut() {
    await signOut()
    await refreshUser()
    setDropdownOpen(false)
    router.push('/')
  }

  return (
    <nav className="border-b border-white/[0.07]">
      <div className="px-8 py-[18px] flex items-center justify-between">

        {/* 로고 */}
        <Link href="/" className="font-syne font-extrabold text-[19px] text-sand">
          pixelkits<span className="text-lime">.</span>
        </Link>

        {/* 링크 */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={cn(
                'text-[13px] transition-colors',
                pathname.startsWith(href)
                  ? 'text-sand font-medium'
                  : 'text-sand/40 hover:text-sand'
              )}>
              {label}
            </Link>
          ))}
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-panel border border-white/10
                           rounded-full pl-3 pr-4 py-1.5 hover:border-white/25 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/30
                                flex items-center justify-center font-syne font-bold text-lime text-[12px]">
                  {userInitial}
                </div>
                <span className="text-[13px] text-sand/70 max-w-[80px] truncate">
                  {userName || userEmail.split('@')[0]}
                </span>
                <span className={`text-sand/30 text-[11px] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {dropdownOpen && (
                <>
                  {/* 외부 클릭 시 닫기 */}
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />

                  <div className="absolute right-0 top-[calc(100%+8px)] w-52
                                  bg-[#111] border border-white/10 rounded-2xl
                                  overflow-hidden shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-white/[0.07]">
                      <p className="text-[13px] font-medium truncate">
                        {userName || '이름 없음'}
                      </p>
                      <p className="text-[11px] text-sand/35 mt-0.5 truncate">{userEmail}</p>
                    </div>

<div className="py-1.5">
  {/* 관리자 버튼 — isAdmin 일 때만 표시 */}
  {isAdmin && (
    <Link href="/admin"
      onClick={() => setDropdownOpen(false)}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                 text-lime/70 hover:bg-lime/[0.05] hover:text-lime transition-colors
                 border-b border-white/[0.07]">
      <span>⚙</span> 관리자 페이지
    </Link>
  )}

  {/* 기존 메뉴 */}
  {[
    { href: '/orders',    label: '구매 내역',   icon: '🧾' },
    { href: '/downloads', label: '다운로드',    icon: '⬇'  },
    { href: '/wishlist',  label: '찜한 템플릿', icon: '♥'  },
    { href: '/settings',  label: '계정 설정',   icon: '⚙'  },
  ].map(({ href, label, icon }) => (
    <Link key={label} href={href}
      onClick={() => setDropdownOpen(false)}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                 text-sand/60 hover:bg-white/[0.05] hover:text-sand transition-colors">
      <span>{icon}</span>{label}
    </Link>
  ))}
</div>

                    <div className="border-t border-white/[0.07] py-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                   text-[#ff5f3f]/70 hover:bg-white/[0.04] hover:text-[#ff5f3f]
                                   transition-colors cursor-pointer">
                        <span>→</span> 로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"
                className="text-[13px] text-sand/50 hover:text-sand transition-colors px-3 py-2">
                로그인
              </Link>
              <Link href="/signup"
                className="bg-lime text-ink font-syne font-bold text-[13px]
                           rounded-full px-5 py-2 hover:opacity-85 transition-opacity">
                회원가입
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}