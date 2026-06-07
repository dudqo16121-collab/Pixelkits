'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PromoCode {
  id: string
  code: string
  discount_percent: number
  expires_at: string | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

type FormState = {
  code: string
  discount_percent: number
  expires_at: string
  max_uses: string   // input은 string으로 관리, 저장 시 변환
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  code: '',
  discount_percent: 10,
  expires_at: '',
  max_uses: '',
  is_active: true,
}

function randCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function isExpired(p: PromoCode) {
  return !!p.expires_at && new Date(p.expires_at) < new Date()
}

function isMaxUsed(p: PromoCode) {
  return p.max_uses !== null && p.used_count >= p.max_uses
}

function statusInfo(p: PromoCode): { label: string; className: string } {
  if (isExpired(p) || isMaxUsed(p))
    return { label: '소진', className: 'text-sand/30 border-white/10' }
  if (!p.is_active)
    return { label: '비활성', className: 'text-sand/40 border-white/15' }
  return { label: '활성', className: 'text-teal bg-teal/10 border-teal/20' }
}

const inputCls = 'w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-sand outline-none focus:border-lime/40 transition-colors placeholder:text-sand/20'

export default function AdminPromosPage() {
  const [promos,   setPromos]   = useState<PromoCode[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'add' | 'edit' | null>(null)
  const [form,     setForm]     = useState<FormState>(EMPTY_FORM)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState<Partial<FormState>>({})
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [copyMsg,  setCopyMsg]  = useState<string | null>(null)

  const fetchPromos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    setPromos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPromos() }, [fetchPromos])

  // ── 필터링 ──────────────────────────────────────────
  const filtered = promos.filter((p) => {
    const matchSearch = !search || p.code.includes(search.toUpperCase())
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? (p.is_active && !isExpired(p) && !isMaxUsed(p)) :
      filter === 'inactive' ? (!p.is_active) :
      filter === 'expired'  ? (isExpired(p) || isMaxUsed(p)) :
      true
    return matchSearch && matchFilter
  })

  // ── 통계 ────────────────────────────────────────────
  const stats = {
    total:    promos.length,
    active:   promos.filter((p) => p.is_active && !isExpired(p) && !isMaxUsed(p)).length,
    used:     promos.reduce((s, p) => s + p.used_count, 0),
    expired:  promos.filter((p) => isExpired(p) || isMaxUsed(p)).length,
  }

  // ── 모달 열기 ────────────────────────────────────────
  function openAdd() {
    setForm({ ...EMPTY_FORM, code: randCode() })
    setEditId(null)
    setErrors({})
    setModal('add')
  }

  function openEdit(p: PromoCode) {
    setForm({
      code:             p.code,
      discount_percent: p.discount_percent,
      expires_at:       p.expires_at ? p.expires_at.slice(0, 10) : '',
      max_uses:         p.max_uses !== null ? String(p.max_uses) : '',
      is_active:        p.is_active,
    })
    setEditId(p.id)
    setErrors({})
    setModal('edit')
  }

  // ── 유효성 검사 ──────────────────────────────────────
  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.code.trim()) {
      e.code = '코드를 입력해주세요' as any
    } else if (!/^[A-Z0-9]{3,20}$/.test(form.code.toUpperCase())) {
      e.code = '영문 대문자·숫자 3~20자만 사용 가능해요' as any
    }
    if (form.discount_percent < 1 || form.discount_percent > 100) {
      e.discount_percent = '할인율은 1~100 사이여야 해요' as any
    }
    if (form.max_uses && (isNaN(Number(form.max_uses)) || Number(form.max_uses) < 1)) {
      e.max_uses = '1 이상의 숫자를 입력해주세요' as any
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── 저장 ────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload = {
      code:             form.code.toUpperCase().trim(),
      discount_percent: form.discount_percent,
      expires_at:       form.expires_at || null,
      max_uses:         form.max_uses ? Number(form.max_uses) : null,
      is_active:        form.is_active,
    }

    if (modal === 'edit' && editId) {
      const { error } = await supabase.from('promo_codes').update(payload).eq('id', editId)
      if (error) { alert('수정 실패: ' + error.message); setSaving(false); return }
    } else {
      // 코드 중복 확인
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('code', payload.code)
        .maybeSingle()
      if (existing) {
        setErrors({ code: '이미 존재하는 코드예요' as any })
        setSaving(false)
        return
      }
      const { error } = await supabase.from('promo_codes').insert({ ...payload, used_count: 0 })
      if (error) { alert('생성 실패: ' + error.message); setSaving(false); return }
    }

    await fetchPromos()
    setModal(null)
    setSaving(false)
  }

  // ── 활성화 토글 ─────────────────────────────────────
  async function toggleActive(p: PromoCode) {
    await supabase.from('promo_codes').update({ is_active: !p.is_active }).eq('id', p.id)
    setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  // ── 삭제 ────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('정말 삭제할까요? 이 코드를 이미 사용한 주문에는 영향이 없어요.')) return
    await supabase.from('promo_codes').delete().eq('id', id)
    setPromos((prev) => prev.filter((p) => p.id !== id))
  }

  // ── 사용 횟수 초기화 ────────────────────────────────
  async function resetUsage(p: PromoCode) {
    if (!confirm(`${p.code} 사용 횟수를 0으로 초기화할까요?`)) return
    await supabase.from('promo_codes').update({ used_count: 0 }).eq('id', p.id)
    setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, used_count: 0 } : x))
  }

  // ── 클립보드 복사 ───────────────────────────────────
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopyMsg(code)
    setTimeout(() => setCopyMsg(null), 1500)
  }

  // ── 폼 필드 업데이트 ────────────────────────────────
  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-8">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">프로모 코드</h1>
          <p className="text-[14px] text-sand/40">할인 코드 생성 및 관리</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-lime text-ink font-syne font-bold text-[13px] rounded-full px-5 py-2.5
                     hover:opacity-85 transition-opacity cursor-pointer flex items-center gap-2">
          + 새 코드 생성
        </button>
      </div>

      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체 코드',   value: stats.total,   color: 'text-sand'  },
          { label: '활성 코드',   value: stats.active,  color: 'text-lime'  },
          { label: '총 사용 횟수', value: stats.used,   color: 'text-teal'  },
          { label: '소진/만료',   value: stats.expired, color: 'text-sand/40' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111] border border-white/[0.07] rounded-2xl p-5">
            <p className="text-[12px] text-sand/35 mb-2">{label}</p>
            <p className={`font-syne font-bold text-2xl ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── 검색 + 필터 ── */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand/25 text-lg">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="코드 검색..."
            className="w-full bg-[#111] border border-white/10 rounded-xl py-2.5 pl-11 pr-4
                       text-[13px] text-sand placeholder:text-sand/20 outline-none focus:border-lime/40
                       transition-colors uppercase"
          />
        </div>
        <div className="flex gap-1 bg-[#111] border border-white/10 rounded-xl p-1">
          {[
            { v: 'all' as const,      l: '전체'   },
            { v: 'active' as const,   l: '활성'   },
            { v: 'inactive' as const, l: '비활성' },
            { v: 'expired' as const,  l: '소진'   },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                ${filter === v ? 'bg-white/10 text-sand' : 'text-sand/40 hover:text-sand'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── 테이블 ── */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        {/* 컬럼 헤더 */}
        <div className="grid grid-cols-[1.8fr_70px_110px_110px_70px_160px] gap-3 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30
                        uppercase tracking-wider font-syne font-bold">
          <span>코드</span>
          <span>할인율</span>
          <span>만료일</span>
          <span>사용 횟수</span>
          <span>상태</span>
          <span>액션</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sand/30">
            <p className="text-3xl mb-3">🎟</p>
            <p className="text-[13px] mb-1">
              {search ? '검색 결과가 없어요' : '생성된 프로모 코드가 없어요'}
            </p>
            {!search && (
              <button onClick={openAdd} className="text-lime text-[13px] mt-3 hover:opacity-75 transition-opacity cursor-pointer">
                첫 번째 코드 만들기 →
              </button>
            )}
          </div>
        ) : (
          filtered.map((p, i) => {
            const { label: statusLabel, className: statusCls } = statusInfo(p)
            const usageStr = p.max_uses !== null ? `${p.used_count} / ${p.max_uses}` : `${p.used_count} / ∞`
            const usagePct = p.max_uses ? Math.min((p.used_count / p.max_uses) * 100, 100) : null
            const expired  = isExpired(p)

            return (
              <div key={p.id}
                className={`grid grid-cols-[1.8fr_70px_110px_110px_70px_160px] gap-3 items-center px-6 py-4
                  ${i < filtered.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>

                {/* 코드 + 생성일 */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[15px] text-lime tracking-[0.12em]">
                      {p.code}
                    </span>
                    <button
                      onClick={() => copyCode(p.code)}
                      title="복사"
                      className="text-sand/20 hover:text-sand/60 transition-colors cursor-pointer text-[12px]">
                      {copyMsg === p.code ? '✓' : '⎘'}
                    </button>
                  </div>
                  <p className="text-[11px] text-sand/25 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString('ko-KR')} 생성
                  </p>
                </div>

                {/* 할인율 */}
                <span className="font-syne font-bold text-[15px] text-sand">
                  {p.discount_percent}%
                </span>

                {/* 만료일 */}
                <span className={`text-[12px] ${expired ? 'text-[#ff5f3f]/70' : 'text-sand/50'}`}>
                  {p.expires_at
                    ? new Date(p.expires_at).toLocaleDateString('ko-KR')
                    : <span className="text-sand/25">제한 없음</span>}
                </span>

                {/* 사용 횟수 + 프로그레스 */}
                <div>
                  <p className={`text-[12px] mb-1 ${isMaxUsed(p) ? 'text-[#ff5f3f]/70' : 'text-sand/50'}`}>
                    {usageStr}
                  </p>
                  {usagePct !== null && (
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-20">
                      <div
                        className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-[#ff5f3f]/60' : 'bg-lime/60'}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 상태 배지 */}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
                  {statusLabel}
                </span>

                {/* 액션 버튼 */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-[11px] text-sand/50 border border-white/10 rounded-lg px-2.5 py-1.5
                               hover:text-sand hover:border-white/25 transition-colors cursor-pointer">
                    수정
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`text-[11px] border rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer
                      ${p.is_active
                        ? 'text-sand/40 border-white/10 hover:text-[#ff5f3f]/70 hover:border-[#ff5f3f]/15'
                        : 'text-teal/60 border-teal/15 hover:text-teal hover:border-teal/30'}`}>
                    {p.is_active ? '끄기' : '켜기'}
                  </button>
                  {p.used_count > 0 && (
                    <button
                      onClick={() => resetUsage(p)}
                      className="text-[11px] text-sand/30 border border-white/[0.07] rounded-lg px-2.5 py-1.5
                                 hover:text-sand/60 hover:border-white/20 transition-colors cursor-pointer">
                      초기화
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-[11px] text-[#ff5f3f]/30 border border-[#ff5f3f]/10 rounded-lg px-2.5 py-1.5
                               hover:text-[#ff5f3f]/70 hover:border-[#ff5f3f]/25 transition-colors cursor-pointer">
                    삭제
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── 생성 / 수정 모달 ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h2 className="font-syne font-bold text-[16px]">
                {modal === 'edit' ? '프로모 코드 수정' : '새 프로모 코드 생성'}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-sand/30 hover:text-sand transition-colors cursor-pointer text-xl leading-none">
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-5">

              {/* 코드 입력 */}
              <div>
                <label className="text-[12px] text-sand/45 mb-1.5 block">
                  프로모 코드 <span className="text-[#ff5f3f]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="SUMMER25"
                    maxLength={20}
                    className={`${inputCls} flex-1 font-mono tracking-[0.1em] ${errors.code ? 'border-[#ff5f3f]/50' : ''}`}
                  />
                  <button
                    onClick={() => setField('code', randCode())}
                    className="border border-white/10 rounded-xl px-3 text-[12px] text-sand/40
                               hover:border-white/25 hover:text-sand transition-colors cursor-pointer whitespace-nowrap">
                    랜덤 생성
                  </button>
                </div>
                {errors.code && (
                  <p className="text-[11px] text-[#ff5f3f] mt-1">{errors.code as any}</p>
                )}
                <p className="text-[11px] text-sand/25 mt-1">영문 대문자·숫자 3~20자</p>
              </div>

              {/* 할인율 */}
              <div>
                <label className="text-[12px] text-sand/45 mb-1.5 block">
                  할인율 (%) <span className="text-[#ff5f3f]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={100}
                    value={form.discount_percent}
                    onChange={(e) => setField('discount_percent', Number(e.target.value))}
                    className={`${inputCls} w-28 ${errors.discount_percent ? 'border-[#ff5f3f]/50' : ''}`}
                  />
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 20, 30, 50].map((v) => (
                      <button key={v}
                        onClick={() => setField('discount_percent', v)}
                        className={`text-[12px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer
                          ${form.discount_percent === v
                            ? 'bg-lime/10 border-lime/30 text-lime'
                            : 'border-white/10 text-sand/40 hover:border-white/25 hover:text-sand'}`}>
                        {v}%
                      </button>
                    ))}
                  </div>
                </div>
                {errors.discount_percent && (
                  <p className="text-[11px] text-[#ff5f3f] mt-1">{errors.discount_percent as any}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 만료일 */}
                <div>
                  <label className="text-[12px] text-sand/45 mb-1.5 block">만료일</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={form.expires_at}
                    onChange={(e) => setField('expires_at', e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-sand/25 mt-1">비워두면 무기한</p>
                </div>

                {/* 최대 사용 횟수 */}
                <div>
                  <label className="text-[12px] text-sand/45 mb-1.5 block">최대 사용 횟수</label>
                  <input
                    type="number" min={1}
                    value={form.max_uses}
                    placeholder="무제한"
                    onChange={(e) => setField('max_uses', e.target.value)}
                    className={`${inputCls} ${errors.max_uses ? 'border-[#ff5f3f]/50' : ''}`}
                  />
                  {errors.max_uses && (
                    <p className="text-[11px] text-[#ff5f3f] mt-1">{errors.max_uses as any}</p>
                  )}
                  <p className="text-[11px] text-sand/25 mt-1">비워두면 무제한</p>
                </div>
              </div>

              {/* 즉시 활성화 토글 */}
              <div className="flex items-center justify-between bg-[#0d0d0d] border border-white/[0.07]
                              rounded-xl px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium">즉시 활성화</p>
                  <p className="text-[11px] text-sand/35 mt-0.5">
                    {form.is_active ? '생성 즉시 사용 가능 상태' : '비활성 상태로 생성됩니다'}
                  </p>
                </div>
                <button
                  onClick={() => setField('is_active', !form.is_active)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0
                    ${form.is_active ? 'bg-lime' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all
                    ${form.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* 미리보기 요약 */}
              {form.code && (
                <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-[11px] text-sand/30 uppercase tracking-wider font-syne font-bold mb-3">미리보기</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg text-lime tracking-widest">{form.code}</span>
                    <span className="text-[12px] text-sand/50">→</span>
                    <span className="text-[13px] text-sand">{form.discount_percent}% 할인</span>
                    {form.expires_at && (
                      <span className="text-[11px] text-sand/35">
                        ~ {new Date(form.expires_at).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                    {form.max_uses && (
                      <span className="text-[11px] text-sand/35">{form.max_uses}회 한정</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-white/10 rounded-xl py-2.5 text-[13px]
                           text-sand/50 hover:text-sand transition-colors cursor-pointer">
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-lime text-ink font-syne font-bold rounded-xl py-2.5
                           text-[13px] hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-40">
                {saving ? '저장 중...' : modal === 'edit' ? '수정 완료' : '코드 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}