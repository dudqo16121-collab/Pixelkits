import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] px-8 py-10 mt-20">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <span className="font-syne font-extrabold text-[17px]">
            pixelkits<span className="text-lime">.</span>
          </span>
          <p className="text-[13px] text-sand/35 mt-2 max-w-[220px] leading-relaxed font-light">
            개발자가 만든 프론트엔드 템플릿 스토어
          </p>
        </div>

        <div className="flex gap-16 text-[13px]">
          <div className="flex flex-col gap-3">
            <span className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-widest">
              제품
            </span>
            <Link href="/templates" className="text-sand/50 hover:text-sand transition-colors">템플릿</Link>
            <Link href="/about"     className="text-sand/50 hover:text-sand transition-colors">소개</Link>
            <Link href="/faq"       className="text-sand/50 hover:text-sand transition-colors">FAQ</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-syne font-bold text-[11px] text-sand/30 uppercase tracking-widest">
              계정
            </span>
            <Link href="/orders" className="text-sand/50 hover:text-sand transition-colors">구매 내역</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-white/[0.06] flex items-center justify-between text-[12px] text-sand/25">
        <span>© 2026 pixelkits. All rights reserved.</span>
        <span>한국 · 원화 결제 · 7일 환불 보장</span>
      </div>
    </footer>
  )
}
