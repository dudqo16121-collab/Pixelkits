'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink">
      <div className="text-center max-w-md">
        <p className="font-syne font-extrabold text-[120px] leading-none text-[#ff5f3f]/10 select-none mb-4">
          500
        </p>
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-3">
          오류가 발생했어요
        </h1>
        <p className="text-[14px] text-sand/45 font-light leading-relaxed mb-2">
          일시적인 서버 오류예요. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-[11px] text-sand/20 font-mono mb-8">
            오류 코드: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-8" />}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-lime text-ink font-syne font-bold text-[13px]
                       rounded-full px-6 py-3 hover:opacity-85 transition-opacity cursor-pointer">
            다시 시도
          </button>
          <Link href="/"
            className="border border-white/15 text-sand/60 text-[13px]
                       rounded-full px-6 py-3 hover:border-white/30 hover:text-sand transition-all">
            홈으로
          </Link>
        </div>
        <p className="text-[12px] text-sand/25 mt-6">
          문제가 계속되면{' '}
          <a href="mailto:support@pixelkits.co"
            className="text-lime/60 hover:text-lime transition-colors">
            support@pixelkits.co
          </a>로 문의해주세요
        </p>
      </div>
    </div>
  )
}