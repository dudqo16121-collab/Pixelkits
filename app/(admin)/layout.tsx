'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, userEmail } = useUser()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 로그인 안 됐거나 관리자 아니면 홈으로
    if (userEmail && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, userEmail, router])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sand/30">
        <div className="w-6 h-6 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
      </div>
    )
  }

  const MENU = [
    { href: '/admin',           icon: '▦', label: '대시보드'    },
    { href: '/admin/templates', icon: '⊞', label: '템플릿 관리' },
    { href: '/admin/orders',    icon: '🧾', label: '주문 조회'   },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-sand font-dm flex">
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.07] flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.07] flex items-center gap-2">
          <span className="font-syne font-extrabold text-[16px]">
            pixelkits<span className="text-lime">.</span>
          </span>
          <span className="text-[10px] bg-lime/15 text-lime border border-lime/25 rounded px-1.5 py-0.5 font-bold">
            ADMIN
          </span>
        </div>

        <nav className="p-4 flex flex-col gap-1 flex-1">
{MENU.map(({ href, icon, label }) => (
  <Link key={href} href={href}
    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors
      ${pathname === href
        ? 'bg-lime/[0.08] text-sand font-medium'
        : 'text-sand/50 hover:bg-white/[0.05] hover:text-sand'}`}>
    <span>{icon}</span>{label}
  </Link>
))}
        </nav>

        <div className="p-4 border-t border-white/[0.07]">
          <Link href="/" className="...">← 스토어로 돌아가기</Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}