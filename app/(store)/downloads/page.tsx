'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDate } from '@/lib/utils'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

const MOCK_DOWNLOADS = [
  {
    id: '1',
    template: { name: 'Lumina SaaS Landing Kit', slug: 'lumina-saas-kit', stack: ['nextjs'] },
    version: 'v1.2',
    downloaded_at: '2026-06-05T10:00:00Z',
    token_expires_at: '2026-06-08T10:00:00Z',
  },
  {
    id: '2',
    template: { name: 'Astra Landing', slug: 'astra-landing', stack: ['nextjs'] },
    version: 'v1.0',
    downloaded_at: '2026-05-22T14:00:00Z',
    token_expires_at: '2026-05-25T14:00:00Z',
  },
]

export default function DownloadsPage() {
  const pathname = usePathname()
  const [downloading, setDownloading] = useState<string | null>(null)

  async function handleDownload(id: string) {
    setDownloading(id)
    await new Promise((r) => setTimeout(r, 1400))
    setDownloading(null)
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-57px)]">
      <aside className="p-6 border-r border-white/[0.07]">
        <div className="card-base rounded-xl p-4 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime/12 border border-lime/25 flex items-center justify-center font-syne font-bold text-lime">김</div>
          <div><p className="text-[13px] font-medium">김개발</p><p className="text-[11px] text-sand/35">dev@example.com</p></div>
        </div>
        <div className="space-y-1">
          {SIDEBAR.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`block px-3 py-2.5 rounded-xl text-[13px] transition-colors
                ${pathname === href ? 'bg-lime/[0.08] text-sand font-medium' : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
              {label}
            </Link>
          ))}
        </div>
      </aside>

      <div className="p-8">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-2">다운로드</h1>
        <p className="text-[14px] text-sand/40 font-light mb-7">구매한 템플릿 파일을 다운로드하세요</p>

        <div className="space-y-4">
          {MOCK_DOWNLOADS.map(({ id, template, version, downloaded_at, token_expires_at }) => {
            const isExpired = new Date(token_expires_at) < new Date()
            return (
              <div key={id} className="card-base rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] border border-white/10 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="font-syne font-bold text-[15px] mb-1">{template.name}</h2>
                    <div className="flex gap-3 text-[12px] text-sand/35 flex-wrap">
                      <span>버전 {version}</span>
                      <span>·</span>
                      <span>{formatDate(downloaded_at)} 구매</span>
                      <span>·</span>
                      <span className={isExpired ? 'text-[#ff5f3f]/70' : 'text-teal'}>
                        {isExpired ? '링크 만료됨' : `${formatDate(token_expires_at)}까지 유효`}
                      </span>
                    </div>
                  </div>
                  <span className="badge-lime text-[11px]">최신 버전</span>
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    { icon: '🗜', name: `${template.slug}-${version}.zip`, size: '4.8 MB', type: 'source'  },
                    { icon: '📄', name: '설치-가이드-한국어.pdf',          size: '1.1 MB', type: 'guide'   },
                    { icon: '📋', name: 'license.txt',                     size: '12 KB',  type: 'license' },
                  ].map(({ icon, name, size, type }) => (
                    <div key={type} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <div className="w-8 h-8 rounded-lg bg-lime/[0.08] border border-lime/15 flex items-center justify-center flex-shrink-0 text-sm">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{name}</p>
                        <p className="text-[11px] text-sand/30">{size}</p>
                      </div>
                      <button onClick={() => handleDownload(id + type)}
                        className="bg-lime text-ink text-[12px] font-bold font-syne px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity cursor-pointer">
                        {downloading === id + type ? '⏳ 준비중' : '⬇ 다운로드'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleDownload(id)} className="btn-lime text-[13px] px-5 py-2.5">
                    {downloading === id ? '⏳ 준비중...' : '⬇ 전체 파일 받기'}
                  </button>
                  {isExpired && <button className="btn-ghost text-[13px] px-5 py-2.5">🔄 링크 재발급</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
