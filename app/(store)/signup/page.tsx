'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [agreed,   setAgreed]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSignup() {
    if (!name || !email || !password) { setError('모든 항목을 입력해주세요'); return }
    if (password.length < 8)          { setError('비밀번호는 8자 이상이어야 해요'); return }
    if (!agreed)                       { setError('이용약관에 동의해주세요'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await signUp(email, password, name)
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 5 ? 2 : password.length > 0 ? 1 : 0

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl text-sand inline-block">
            pixelkits<span className="text-lime">.</span>
          </Link>
          <p className="text-[14px] text-sand/40 mt-2 font-light">함께해요!</p>
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-7">
          <h1 className="font-syne font-bold text-[18px] mb-6">회원가입</h1>

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand placeholder:text-sand/20
                           outline-none focus:border-lime/40 transition-colors" />
            </div>
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand placeholder:text-sand/20
                           outline-none focus:border-lime/40 transition-colors" />
            </div>
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand placeholder:text-sand/20
                           outline-none focus:border-lime/40 transition-colors" />
              {password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map((level) => (
                    <div key={level} className={`flex-1 h-1 rounded-full transition-colors
                      ${strength >= level
                        ? level <= 1 ? 'bg-[#ff5f3f]'
                        : level <= 2 ? 'bg-amber-400'
                        : level <= 3 ? 'bg-lime/70'
                        : 'bg-lime'
                        : 'bg-white/[0.07]'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 mb-5">
            <button onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer
                ${agreed ? 'bg-lime border-lime' : 'bg-transparent border-white/15'}`}>
              {agreed && <span className="text-ink text-[11px] font-bold">✓</span>}
            </button>
            <p className="text-[12px] text-sand/40 leading-relaxed">
              <span className="text-lime cursor-pointer hover:underline">이용약관</span> 및{' '}
              <span className="text-lime cursor-pointer hover:underline">개인정보처리방침</span>에 동의합니다
            </p>
          </div>

          {error && (
            <p className="text-[12px] text-[#ff5f3f] mb-4 bg-[#ff5f3f]/10 border border-[#ff5f3f]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button onClick={handleSignup} disabled={loading}
            className="w-full bg-lime text-ink font-syne font-bold rounded-xl py-3.5
                       text-[14px] hover:opacity-85 transition-opacity cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed mb-4">
            {loading ? '가입 중...' : '회원가입'}
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
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-lime hover:opacity-75 transition-opacity">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
