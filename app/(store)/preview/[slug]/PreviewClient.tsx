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
  slug:         string
  previewUrl:   string | null
  thumbnailUrl: string | null
  price:        number
  templateName: string
}

export function PreviewClient({ slug, previewUrl, thumbnailUrl, price, templateName }: Props) {
  const [device,  setDevice]  = useState<Device>('desktop')
  const [loading, setLoading] = useState(true)

  const current = DEVICES.find((d) => d.id === device)!

  // preview_url도 thumbnail_url도 없는 경우
  const hasNothing = !previewUrl && !thumbnailUrl

  return (
    <>
      {/* 디바이스 토글 — iframe 있을 때만 표시 */}
      {previewUrl && (
        <div className="flex items-center gap-1 bg-ink border border-white/10 rounded-xl p-1">
          {DEVICES.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => { setDevice(id); setLoading(true) }}
              title={label}
              className={`px-3 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                ${device === id
                  ? 'bg-white/10 text-sand'
                  : 'text-sand/30 hover:text-sand/60'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      )}

      {/* 구매 버튼 */}
      <Link
        href={`/checkout?template=${slug}`}
        className="bg-lime text-ink font-syne font-bold text-[13px]
                   rounded-full px-5 py-2 hover:opacity-85 transition-opacity"
      >
        {price > 0 ? `${formatPrice(price)} 구매하기 →` : '무료로 받기 →'}
      </Link>

      {/* ── 미리보기 본체 (fixed로 툴바 아래 채우기) ── */}
      <div className="fixed inset-0 top-[49px] bg-[#050505] flex flex-col items-center overflow-auto">

        {/* preview_url 있으면 iframe */}
        {previewUrl ? (
          <div
            style={{ width: current.width }}
            className="relative flex-shrink-0 min-h-screen transition-all duration-300"
          >
            {/* 로딩 오버레이 */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink z-10">
                <div className="flex flex-col items-center gap-3 text-sand/30">
                  <div className="w-8 h-8 border-2 border-lime/30 border-t-lime
                                  rounded-full animate-spin" />
                  <span className="text-[13px]">미리보기 로딩 중...</span>
                </div>
              </div>
            )}

            {/* 태블릿·모바일: 디바이스 프레임 */}
            {device !== 'desktop' && (
              <div className={`mx-auto mt-8 rounded-[2rem] border-4 border-white/10
                               overflow-hidden shadow-2xl bg-ink
                               ${device === 'tablet' ? 'w-[768px]' : 'w-[390px]'}`}
                style={{ height: device === 'tablet' ? '1024px' : '844px' }}
              >
                <iframe
                  key={device}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  onLoad={() => setLoading(false)}
                  title={`${templateName} 미리보기`}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            )}

            {/* 데스크탑: 전체 너비 */}
            {device === 'desktop' && (
              <iframe
                key={device}
                src={previewUrl}
                className="w-full border-0"
                style={{ height: '100vh' }}
                onLoad={() => setLoading(false)}
                title={`${templateName} 미리보기`}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            )}
          </div>

        ) : thumbnailUrl ? (
          /* preview_url 없고 thumbnail만 있으면 이미지로 */
          <div className="max-w-5xl w-full mx-auto mt-8 px-4">
            <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
              {/* 브라우저 바 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07] bg-[#1a1a1a]">
                {['#ff5f57','#febc2e','#28c840'].map((c) => (
                  <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <img
                src={thumbnailUrl}
                alt={`${templateName} 미리보기`}
                className="w-full object-cover object-top"
              />
            </div>
            <p className="text-center text-[13px] text-sand/30 mt-4">
              라이브 미리보기가 준비되지 않았어요. 썸네일로 대체합니다.
            </p>
          </div>

        ) : (
          /* 둘 다 없으면 안내 */
          <div className="flex flex-col items-center justify-center flex-1
                          text-sand/25 gap-3 mt-24">
            <p className="text-4xl">⛶</p>
            <p className="text-[14px]">미리보기를 준비 중이에요</p>
            <p className="text-[13px] text-sand/20">잠시 후 다시 확인해주세요</p>
            <Link href={`/templates/${slug}`}
              className="mt-4 text-[13px] text-lime/70 hover:text-lime transition-colors">
              상세 페이지로 돌아가기 →
            </Link>
          </div>
        )}

      </div>
    </>
  )
}