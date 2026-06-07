'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit() {
    if (!email.trim()) { setError('이메일을 입력해주세요'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError('이메일 전송에 실패했어요. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl text-sand inline-block">
            pixelkits<span className="text-lime">.</span>
          </Link>
          <p className="text-[14px] text-sand/40 mt-2 font-light">비밀번호 재설정</p>
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-7">

          {sent ? (
            /* ── 전송 완료 ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20
                              flex items-center justify-center mx-auto mb-5 text-2xl">
                ✉
              </div>
              <h1 className="font-syne font-bold text-[18px] mb-2">이메일을 확인해주세요</h1>
              <p className="text-[13px] text-sand/45 leading-relaxed mb-1">
                <span className="text-sand/70">{email}</span>으로
              </p>
              <p className="text-[13px] text-sand/45 leading-relaxed mb-6">
                비밀번호 재설정 링크를 보냈어요.
              </p>
              <p className="text-[12px] text-sand/30 mb-6">
                이메일이 오지 않았다면 스팸 폴더를 확인하거나,
                아래 버튼을 눌러 다시 보내주세요.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-[13px] text-lime/70 hover:text-lime transition-colors cursor-pointer">
                다시 보내기
              </button>
            </div>
          ) : (
            /* ── 이메일 입력 폼 ── */
            <>
              <h1 className="font-syne font-bold text-[18px] mb-2">비밀번호 찾기</h1>
              <p className="text-[13px] text-sand/40 mb-6 leading-relaxed">
                가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드려요.
              </p>

              <div className="mb-4">
                <label className="text-[12px] text-sand/45 mb-1.5 block">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="hello@example.com"
                  autoFocus
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                             text-[14px] text-sand placeholder:text-sand/20
                             outline-none focus:border-lime/40 transition-colors"
                />
              </div>

              {error && (
                <p className="text-[12px] text-[#ff5f3f] mb-4 bg-[#ff5f3f]/10
                              border border-[#ff5f3f]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-lime text-ink font-syne font-bold rounded-xl py-3.5
                           text-[14px] hover:opacity-85 transition-opacity cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[13px] text-sand/35 mt-5">
          <Link href="/login" className="text-lime/70 hover:text-lime transition-colors">
            ← 로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}