'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [ready,     setReady]     = useState(false)  // 세션 복구 완료 여부

  // Supabase가 URL hash에서 세션을 복구할 때까지 대기
  useEffect(() => {
    // onAuthStateChange로 PASSWORD_RECOVERY 이벤트 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // 이미 세션이 있는 경우 (페이지 새로고침 등)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const strength =
    password.length >= 12 ? 4 :
    password.length >= 8  ? 3 :
    password.length >= 5  ? 2 :
    password.length > 0   ? 1 : 0

  async function handleReset() {
    setError('')
    if (!password)              { setError('새 비밀번호를 입력해주세요'); return }
    if (password.length < 8)    { setError('비밀번호는 8자 이상이어야 해요'); return }
    if (password !== confirm)   { setError('비밀번호가 일치하지 않아요'); return }

    setLoading(true)

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError('비밀번호 변경에 실패했어요. 링크가 만료됐을 수 있어요.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    // 3초 후 로그인 페이지로 이동
    setTimeout(() => router.push('/'), 3000)
  }

  const inputCls = 'w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-sand placeholder:text-sand/20 outline-none focus:border-lime/40 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl text-sand inline-block">
            pixelkits<span className="text-lime">.</span>
          </Link>
          <p className="text-[14px] text-sand/40 mt-2 font-light">새 비밀번호 설정</p>
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-7">

          {done ? (
            /* ── 변경 완료 ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-lime/10 border border-lime/20
                              flex items-center justify-center mx-auto mb-5 text-2xl">
                ✓
              </div>
              <h1 className="font-syne font-bold text-[18px] mb-2">변경 완료!</h1>
              <p className="text-[13px] text-sand/45 leading-relaxed mb-6">
                비밀번호가 성공적으로 변경됐어요.<br />
                잠시 후 홈으로 이동해요.
              </p>
              <Link href="/" className="text-[13px] text-lime hover:opacity-75 transition-opacity">
                지금 이동하기 →
              </Link>
            </div>

          ) : !ready ? (
            /* ── 세션 로딩 중 ── */
            <div className="text-center py-8">
              <div className="w-7 h-7 border-2 border-lime/30 border-t-lime rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[13px] text-sand/40">링크를 확인하는 중이에요...</p>
            </div>

          ) : (
            /* ── 비밀번호 입력 폼 ── */
            <>
              <h1 className="font-syne font-bold text-[18px] mb-2">새 비밀번호 설정</h1>
              <p className="text-[13px] text-sand/40 mb-6">8자 이상의 새 비밀번호를 입력해주세요.</p>

              <div className="space-y-4 mb-5">

                {/* 새 비밀번호 */}
                <div>
                  <label className="text-[12px] text-sand/45 mb-1.5 block">새 비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="8자 이상 입력"
                    autoFocus
                    className={inputCls}
                  />
                  {/* 강도 표시 */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} className={`flex-1 h-1 rounded-full transition-colors
                          ${strength >= level
                            ? level <= 1 ? 'bg-[#ff5f3f]'
                              : level <= 2 ? 'bg-amber-400'
                              : level <= 3 ? 'bg-lime/70'
                              : 'bg-lime'
                            : 'bg-white/[0.07]'}`}
                        />
                      ))}
                    </div>
                  )}
                  {password.length > 0 && (
                    <p className={`text-[11px] mt-1 ${
                      strength <= 1 ? 'text-[#ff5f3f]' :
                      strength <= 2 ? 'text-amber-400' :
                      strength <= 3 ? 'text-lime/70'   : 'text-lime'}`}>
                      {strength <= 1 ? '너무 짧아요' :
                       strength <= 2 ? '조금 더 길게' :
                       strength <= 3 ? '좋아요' : '안전한 비밀번호예요'}
                    </p>
                  )}
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label className="text-[12px] text-sand/45 mb-1.5 block">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                    placeholder="동일하게 입력"
                    className={`${inputCls} ${
                      confirm.length > 0
                        ? password === confirm
                          ? 'border-lime/30'
                          : 'border-[#ff5f3f]/30'
                        : ''}`}
                  />
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-[11px] text-[#ff5f3f] mt-1">비밀번호가 일치하지 않아요</p>
                  )}
                  {confirm.length > 0 && password === confirm && (
                    <p className="text-[11px] text-lime mt-1">✓ 일치해요</p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-[#ff5f3f] mb-4 bg-[#ff5f3f]/10
                              border border-[#ff5f3f]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                className="w-full bg-lime text-ink font-syne font-bold rounded-xl py-3.5
                           text-[14px] hover:opacity-85 transition-opacity cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </>
          )}
        </div>

        {!done && (
          <p className="text-center text-[13px] text-sand/35 mt-5">
            <Link href="/forgot-password" className="text-lime/70 hover:text-lime transition-colors">
              ← 이메일 다시 받기
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}