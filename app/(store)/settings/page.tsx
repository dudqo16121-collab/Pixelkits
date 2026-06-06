'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

const SIDEBAR = [
  { label: '구매 내역',   href: '/orders'    },
  { label: '다운로드',    href: '/downloads' },
  { label: '찜한 템플릿', href: '/wishlist'  },
  { label: '계정 설정',   href: '/settings'  },
]

export default function SettingsPage() {
  const pathname = usePathname()
  const router   = useRouter()
  const { refreshUser } = useUser()

  const [userId,   setUserId]   = useState<string | null>(null)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [pwForm,   setPwForm]   = useState({ current: '', next: '', confirm: '' })
  const [pwMsg,    setPwMsg]    = useState('')
  const [notify,   setNotify]   = useState({
    new_template: true, order: true, newsletter: false,
  })

  // 현재 유저 정보 불러오기
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)
      setEmail(user.email ?? '')

      // profiles 테이블에서 추가 정보 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (profile) setName(profile.name ?? '')

      // 알림 설정 조회
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (notifData) {
        setNotify({
          new_template: notifData.new_template,
          order:        notifData.order_update,
          newsletter:   notifData.newsletter,
        })
      }

      setLoading(false)
    }
    loadUser()
  }, [router])

  // 프로필 저장
  async function saveProfile() {
    if (!userId) return
    setSaving(true)

    // profiles 테이블 업데이트
    await supabase
      .from('profiles')
      .upsert({ id: userId, name })

    // 알림 설정 저장
    await supabase
      .from('notification_settings')
      .upsert({
        user_id:      userId,
        new_template: notify.new_template,
        order_update: notify.order,
        newsletter:   notify.newsletter,
      })

    setSaving(false)
    setSaved(true)
    await refreshUser()
    setTimeout(() => setSaved(false), 2500)
  }

  // 비밀번호 변경
  async function changePassword() {
    if (!pwForm.next || !pwForm.confirm) {
      setPwMsg('새 비밀번호를 입력해주세요')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('새 비밀번호가 일치하지 않아요')
      return
    }
    if (pwForm.next.length < 8) {
      setPwMsg('비밀번호는 8자 이상이어야 해요')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) {
      setPwMsg('비밀번호 변경에 실패했어요')
    } else {
      setPwMsg('비밀번호가 변경됐어요!')
      setPwForm({ current: '', next: '', confirm: '' })
    }
    setTimeout(() => setPwMsg(''), 3000)
  }

  // 계정 삭제
async function deleteAccount() {
  if (!confirm('정말 계정을 삭제할까요? 구매 내역과 다운로드 권한도 모두 사라져요.')) return

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/user/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  const data = await res.json()

  if (!res.ok) { alert(data.error); return }

  await supabase.auth.signOut()
  router.push('/')
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sand/30">
        <div className="w-6 h-6 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-3" />
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-57px)]">
      {/* 사이드바 */}
      <aside className="p-6 border-r border-white/[0.07]">
        <div className="card-base rounded-xl p-4 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime/12 border border-lime/25
                          flex items-center justify-center font-syne font-bold text-lime">
            {name?.[0] ?? email?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-[13px] font-medium truncate">{name || '이름 없음'}</p>
            <p className="text-[11px] text-sand/35 truncate">{email}</p>
          </div>
        </div>
        <div className="space-y-1">
          {SIDEBAR.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`block px-3 py-2.5 rounded-xl text-[13px] transition-colors
                ${pathname === href
                  ? 'bg-lime/[0.08] text-sand font-medium'
                  : 'text-sand/50 hover:bg-white/[0.04] hover:text-sand'}`}>
              {label}
            </Link>
          ))}
        </div>
      </aside>

      {/* 콘텐츠 */}
      <div className="p-8 max-w-2xl">
        <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-8">계정 설정</h1>

        {/* 프로필 */}
        <section className="card-base rounded-2xl p-6 mb-5">
          <h2 className="font-syne font-bold text-[15px] mb-5">프로필</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-lime/12 border border-lime/25
                            flex items-center justify-center font-syne font-extrabold text-lime text-xl">
              {name?.[0] ?? email?.[0] ?? '?'}
            </div>
            <div>
              <p className="text-[13px] text-sand/50 mb-1">프로필 이미지</p>
              <button className="text-[12px] text-lime border border-lime/25 bg-lime/[0.08]
                                 rounded-lg px-3 py-1.5 hover:bg-lime/15 transition-colors cursor-pointer">
                이미지 변경
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="이름 입력"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                           text-[14px] text-sand outline-none focus:border-lime/40 transition-colors" />
            </div>
            <div>
              <label className="text-[12px] text-sand/45 mb-1.5 block">이메일</label>
              <input type="email" value={email} disabled
                className="w-full bg-[#0d0d0d] border border-white/[0.06] rounded-xl px-4 py-3
                           text-[14px] text-sand/40 cursor-not-allowed" />
              <p className="text-[11px] text-sand/25 mt-1.5">이메일은 변경할 수 없어요</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button onClick={saveProfile} disabled={saving}
              className="btn-lime text-[13px] px-5 py-2.5 disabled:opacity-40">
              {saving ? '저장 중...' : saved ? '✓ 저장됨' : '변경사항 저장'}
            </button>
            {saved && <span className="text-[13px] text-teal">저장되었어요!</span>}
          </div>
        </section>

        {/* 비밀번호 변경 */}
        <section className="card-base rounded-2xl p-6 mb-5">
          <h2 className="font-syne font-bold text-[15px] mb-5">비밀번호 변경</h2>
          <div className="space-y-4">
            {[
              { label: '새 비밀번호',      key: 'next',    placeholder: '8자 이상 입력' },
              { label: '새 비밀번호 확인', key: 'confirm', placeholder: '동일하게 입력' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-[12px] text-sand/45 mb-1.5 block">{label}</label>
                <input type="password" placeholder={placeholder}
                  value={pwForm[key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                             text-[14px] text-sand placeholder:text-sand/20
                             outline-none focus:border-lime/40 transition-colors" />
              </div>
            ))}
          </div>

          {pwMsg && (
            <p className={`text-[12px] mt-3 px-3 py-2 rounded-lg border
              ${pwMsg.includes('변경됐어요')
                ? 'text-teal bg-teal/[0.07] border-teal/15'
                : 'text-[#ff5f3f] bg-[#ff5f3f]/10 border-[#ff5f3f]/20'}`}>
              {pwMsg}
            </p>
          )}

          <button onClick={changePassword} className="btn-lime text-[13px] px-5 py-2.5 mt-5">
            비밀번호 변경
          </button>
        </section>

        {/* 알림 설정 */}
        <section className="card-base rounded-2xl p-6 mb-5">
          <h2 className="font-syne font-bold text-[15px] mb-5">알림 설정</h2>
          <div className="space-y-4">
            {[
              { key: 'new_template', label: '새 템플릿 출시 알림', sub: '새 템플릿 등록 시 이메일 알림' },
              { key: 'order',        label: '구매 · 결제 알림',    sub: '결제 완료, 환불 처리 시 알림' },
              { key: 'newsletter',   label: '뉴스레터',             sub: '프로모션, 업데이트 소식' },
            ].map(({ key, label, sub }) => (
              <div key={key}
                className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.06] last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{label}</p>
                  <p className="text-[12px] text-sand/35 mt-0.5">{sub}</p>
                </div>
                <button
                  onClick={() => setNotify({ ...notify, [key]: !notify[key as keyof typeof notify] })}
                  className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer relative
                    ${notify[key as keyof typeof notify] ? 'bg-lime' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                    ${notify[key as keyof typeof notify] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="btn-lime text-[13px] px-5 py-2.5 mt-5 disabled:opacity-40">
            {saving ? '저장 중...' : '알림 설정 저장'}
          </button>
        </section>

        {/* 계정 삭제 */}
        <section className="border border-[#ff5f3f]/15 rounded-2xl p-6 bg-[#ff5f3f]/[0.02]">
          <h2 className="font-syne font-bold text-[15px] text-[#ff5f3f]/80 mb-2">위험 구역</h2>
          <p className="text-[13px] text-sand/40 font-light mb-4">
            계정을 삭제하면 구매 내역과 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <button onClick={deleteAccount}
            className="text-[13px] text-[#ff5f3f]/70 border border-[#ff5f3f]/20 rounded-xl px-4 py-2
                       hover:text-[#ff5f3f] hover:border-[#ff5f3f]/40 transition-colors cursor-pointer">
            계정 삭제
          </button>
        </section>
      </div>
    </div>
  )
}