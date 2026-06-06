'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await signIn(email, password)
    if (authError) {
      setError('이메일 또는 비밀번호가 맞지 않아요')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl text-sand inline-block">
            pixelkits<span className="text-lime">.</span>
          </Link>
          <p className="text-[14px] text-sand/40 mt-2 font-light">다시 만나서 반가워요</p>
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-7">
          <h1 className="font-syne font-bold text-[18px] mb-6">로그인</h1>

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand placeholder:text-sand/20
                           outline-none focus:border-lime/40 transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] text-sand/45">비밀번호</label>
                <span className="text-[12px] text-lime/70 hover:text-lime transition-colors cursor-pointer">
                  비밀번호 찾기
                </span>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand placeholder:text-sand/20
                           outline-none focus:border-lime/40 transition-colors" />
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-[#ff5f3f] mb-4 bg-[#ff5f3f]/10 border border-[#ff5f3f]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-lime text-ink font-syne font-bold rounded-xl py-3.5
                       text-[14px] hover:opacity-85 transition-opacity cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed mb-4">
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] text-sand/25">또는</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <div className="space-y-2.5">
            <button className="w-full flex items-center justify-center gap-2.5 bg-[#fee500] text-[#3a1d1d]
                               rounded-xl py-3 text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
              🟡 카카오로 계속하기
            </button>
            <button className="w-full flex items-center justify-center gap-2.5 bg-[#03C75A] text-white
                               rounded-xl py-3 text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
              💚 네이버로 계속하기
            </button>
          </div>
        </div>

        <p className="text-center text-[13px] text-sand/35 mt-5">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-lime hover:opacity-75 transition-opacity">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
