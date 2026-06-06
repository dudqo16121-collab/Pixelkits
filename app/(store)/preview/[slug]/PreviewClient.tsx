'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICES: { id: Device; icon: string; label: string; width: string }[] = [
  { id: 'desktop', icon: '🖥',  label: '데스크탑', width: '100%'  },
  { id: 'tablet',  icon: '📟',  label: '태블릿',   width: '768px' },
  { id: 'mobile',  icon: '📱',  label: '모바일',   width: '390px' },
]

interface Props {
  slug: string
  previewUrl: string
  price: number
}

export function PreviewClient({ slug, previewUrl, price }: Props) {
  const [device,  setDevice]  = useState<Device>('desktop')
  const [loading, setLoading] = useState(true)

  const current = DEVICES.find((d) => d.id === device)!

  return (
    <>
      {/* 디바이스 토글 */}
      <div className="flex items-center gap-1 bg-ink border border-white/10 rounded-xl p-1">
        {DEVICES.map(({ id, icon, label }) => (
          <button key={id} onClick={() => { setDevice(id); setLoading(true) }}
            title={label}
            className={`px-3 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
              ${device === id
                ? 'bg-white/10 text-sand'
                : 'text-sand/30 hover:text-sand/60'}`}>
            {icon}
          </button>
        ))}
      </div>

      {/* iframe 전체화면 */}
      <div className="fixed inset-0 top-[49px] flex items-start justify-center bg-[#050505] overflow-auto">
        <div
          style={{ width: current.width }}
          className="relative h-full transition-all duration-300 flex-shrink-0 min-h-screen">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink z-10">
              <div className="flex flex-col items-center gap-3 text-sand/30">
                <div className="w-8 h-8 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                <span className="text-[13px]">미리보기 로딩 중...</span>
              </div>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="w-full border-0"
            style={{ height: '100vh' }}
            onLoad={() => setLoading(false)}
            title={`${slug} 미리보기`}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* 구매 버튼 */}
      <Link
        href={`/checkout?template=${slug}`}
        className="btn-lime text-[13px] px-5 py-2">
        {formatPrice(price)} 구매하기 →
      </Link>
    </>
  )
}
