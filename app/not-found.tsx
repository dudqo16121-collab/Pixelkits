import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink">
      <div className="text-center max-w-md">
        <p className="font-syne font-extrabold text-[120px] leading-none text-lime/10 select-none mb-4">
          404
        </p>
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-3">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-[14px] text-sand/45 font-light leading-relaxed mb-8">
          요청하신 페이지가 삭제됐거나 주소가 변경됐어요.<br />
          URL을 다시 확인해주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="bg-lime text-ink font-syne font-bold text-[13px]
                       rounded-full px-6 py-3 hover:opacity-85 transition-opacity">
            홈으로 가기
          </Link>
          <Link href="/templates"
            className="border border-white/15 text-sand/60 text-[13px]
                       rounded-full px-6 py-3 hover:border-white/30 hover:text-sand transition-all">
            템플릿 보기
          </Link>
        </div>
      </div>
    </div>
  )
}