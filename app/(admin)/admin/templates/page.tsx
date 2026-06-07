'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { Template, TemplateCategory, TemplateStack } from '@/types'

const BADGE_COLORS: Record<string, string> = {
  new:  'bg-lime/15 text-lime',
  hot:  'bg-[#ff5f3f]/15 text-[#ff5f3f]',
  free: 'bg-teal/15 text-teal',
  sale: 'bg-amber-500/15 text-amber-400',
}

const EMPTY_FORM: Partial<Template> = {
  name: '', slug: '', description: '',
  category: 'landing', stack: [],
  price: 0, original_price: 0,
  thumbnail_url: '', preview_url: '', download_url: '',
  file_size_kb: 0, badge: undefined,
  rating: 5.0, download_count: 0,
  features: [], sections: [],
  is_published: true,
}

const CATEGORIES: TemplateCategory[] = ['landing', 'saas', 'portfolio', 'ecom', 'dashboard', 'blog']
const STACKS: TemplateStack[]        = ['nextjs', 'react', 'vue', 'html', 'astro']
const BADGES                         = ['new', 'hot', 'free', 'sale']

export default function AdminTemplatesPage() {
  const [templates,       setTemplates]       = useState<Template[]>([])
  const [loading,         setLoading]         = useState(true)
  const [modal,           setModal]           = useState<'add' | 'edit' | null>(null)
  const [form,            setForm]            = useState<Partial<Template>>(EMPTY_FORM)
  const [deleteId,        setDeleteId]        = useState<string | null>(null)
  const [saving,          setSaving]          = useState(false)
  const [errors,          setErrors]          = useState<Record<string, string>>({})
  const [tab,             setTab]             = useState<'basic' | 'detail' | 'files'>('basic')
  const [uploadingThumb,  setUploadingThumb]  = useState(false)
  const [uploadingZip,    setUploadingZip]    = useState(false)
  const [uploadingGuide,  setUploadingGuide]  = useState(false)
  const [uploadingLicense,setUploadingLicense]= useState(false)
  const [thumbPreview,    setThumbPreview]    = useState<string | null>(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setErrors({})
    setTab('basic')
    setThumbPreview(null)
    setModal('add')
  }

  function openEdit(t: Template) {
    setForm({ ...t })
    setErrors({})
    setTab('basic')
    setThumbPreview(t.thumbnail_url ?? null)
    setModal('edit')
  }

  function set<K extends keyof Template>(key: K, val: Template[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name)        e.name        = '템플릿 이름을 입력해주세요'
    if (!form.slug)        e.slug        = 'Slug를 입력해주세요'
    if (!form.description) e.description = '설명을 입력해주세요'
    if (!form.preview_url) e.preview_url = '미리보기 URL을 입력해주세요'
    if ((form.price ?? 0) < 0) e.price  = '가격은 0 이상이어야 해요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) { setTab('basic'); return }
    setSaving(true)

    const payload = { ...form, updated_at: new Date().toISOString() }

    if (modal === 'edit' && form.id) {
      const { error } = await supabase.from('templates').update(payload).eq('id', form.id)
      if (error) { alert('수정 실패: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('templates').insert({ ...payload, created_at: new Date().toISOString() })
      if (error) { alert('추가 실패: ' + error.message); setSaving(false); return }
    }

    await fetchTemplates()
    setModal(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('templates').delete().eq('id', id)
    await fetchTemplates()
    setDeleteId(null)
  }

  async function togglePublish(t: Template) {
    await supabase.from('templates').update({ is_published: !t.is_published }).eq('id', t.id)
    await fetchTemplates()
  }

  function addArrayItem(key: 'features' | 'sections', val: string) {
    if (!val.trim()) return
    set(key, [...(form[key] ?? []), val.trim()] as any)
  }
  function removeArrayItem(key: 'features' | 'sections', idx: number) {
    set(key, (form[key] ?? []).filter((_, i) => i !== idx) as any)
  }
  function toggleStack(s: TemplateStack) {
    const cur = (form.stack ?? []) as TemplateStack[]
    set('stack', cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])
  }

  // ── 파일 업로드 함수들 ──────────────────────────────────
  async function uploadThumbnail(file: File) {
    if (file.size > 5 * 1024 * 1024) { alert('썸네일은 5MB 이하만 가능해요'); return }
    setUploadingThumb(true)
    const ext  = file.name.split('.').pop()
    const slug = form.slug || `thumb-${Date.now()}`
    const path = `${slug}.${ext}`
    const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true })
    if (error) { alert('썸네일 업로드 실패: ' + error.message); setUploadingThumb(false); return }
    const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
    set('thumbnail_url', publicUrl)
    setThumbPreview(publicUrl)
    setUploadingThumb(false)
  }

  async function uploadZip(file: File) {
    if (!file.name.endsWith('.zip')) { alert('.zip 파일만 업로드 가능해요'); return }
    if (file.size > 200 * 1024 * 1024) { alert('ZIP은 200MB 이하만 가능해요'); return }
    setUploadingZip(true)
    const slug = form.slug || `template-${Date.now()}`
    const path = `${slug}.zip`
    const { error } = await supabase.storage.from('templates').upload(path, file, { upsert: true })
    if (error) { alert('ZIP 업로드 실패: ' + error.message); setUploadingZip(false); return }
    set('download_url', path)
    set('file_size_kb', Math.round(file.size / 1024))
    setUploadingZip(false)
  }

  async function uploadGuide(file: File) {
    if (!file.name.endsWith('.pdf')) { alert('PDF 파일만 업로드 가능해요'); return }
    setUploadingGuide(true)
    const slug = form.slug || `guide-${Date.now()}`
    const { error } = await supabase.storage.from('templates').upload(`${slug}-guide.pdf`, file, { upsert: true })
    if (error) { alert('가이드 업로드 실패: ' + error.message) }
    setUploadingGuide(false)
  }

  async function uploadLicense(file: File) {
    setUploadingLicense(true)
    const slug = form.slug || `license-${Date.now()}`
    const { error } = await supabase.storage.from('templates').upload(`${slug}-license.txt`, file, { upsert: true })
    if (error) { alert('라이선스 업로드 실패: ' + error.message) }
    setUploadingLicense(false)
  }

  const uploadZone = (uploading: boolean, done: boolean, icon: string, label: string, sub: string) =>
    `flex ${done ? 'items-center gap-4' : 'flex-col items-center gap-2'} border-2 border-dashed rounded-xl
     ${done ? 'px-5 py-4' : 'p-6'} cursor-pointer transition-all
     ${uploading
       ? 'border-lime/40 bg-lime/[0.04] pointer-events-none'
       : done
       ? 'border-teal/30 bg-teal/[0.04]'
       : 'border-white/10 hover:border-lime/30 hover:bg-lime/[0.02]'}`

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">템플릿 관리</h1>
          <p className="text-[14px] text-sand/40">{templates.length}개 템플릿</p>
        </div>
        <button onClick={openAdd}
          className="bg-lime text-ink font-syne font-bold text-[13px] rounded-full px-5 py-2.5
                     hover:opacity-85 transition-opacity cursor-pointer">
          + 새 템플릿 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px_140px] gap-4 px-6 py-3
                        border-b border-white/[0.07] text-[11px] text-sand/30
                        uppercase tracking-wider font-syne font-bold">
          <span>템플릿</span><span>카테고리</span><span>가격</span>
          <span>뱃지</span><span>상태</span><span>액션</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sand/30">
            <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-sand/30">
            <p className="text-2xl mb-2">⊞</p>
            <p className="text-[13px]">등록된 템플릿이 없어요</p>
          </div>
        ) : templates.map((t, i) => (
          <div key={t.id}
            className={`grid grid-cols-[2fr_1fr_1fr_80px_80px_140px] gap-4 items-center
                        px-6 py-4 text-[13px]
                        ${i < templates.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>

            {/* 템플릿 정보 */}
            <div className="flex items-center gap-3 min-w-0">
              {t.thumbnail_url ? (
                <img src={t.thumbnail_url} alt={t.name}
                  className="w-10 h-7 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-7 rounded bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f] flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{t.name}</p>
                <p className="text-[11px] text-sand/30 font-mono truncate">{t.slug}</p>
              </div>
            </div>

            {/* 카테고리 */}
            <span className="text-sand/50 capitalize text-[12px]">{t.category}</span>

            {/* 가격 */}
            <span className="font-syne font-bold text-lime">
              {t.price === 0 ? '무료' : formatPrice(t.price)}
            </span>

            {/* 뱃지 */}
            <span>
              {t.badge ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[t.badge]}`}>
                  {t.badge.toUpperCase()}
                </span>
              ) : <span className="text-sand/20">—</span>}
            </span>

            {/* 상태 토글 */}
            <button onClick={() => togglePublish(t)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all
                ${t.is_published
                  ? 'text-teal bg-teal/10 border-teal/20'
                  : 'text-sand/30 border-white/10 hover:border-white/20'}`}>
              {t.is_published ? '공개' : '비공개'}
            </button>

            {/* 액션 버튼 */}
            <div className="flex gap-1.5">
              <button onClick={() => openEdit(t)}
                className="text-[11px] text-sand/50 border border-white/10 rounded-lg px-2.5 py-1.5
                           hover:text-sand hover:border-white/25 transition-colors cursor-pointer">
                수정
              </button>
              <button onClick={() => setDeleteId(t.id)}
                className="text-[11px] text-[#ff5f3f]/40 border border-[#ff5f3f]/10 rounded-lg px-2.5 py-1.5
                           hover:text-[#ff5f3f] hover:border-[#ff5f3f]/30 transition-colors cursor-pointer">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── 추가 / 수정 모달 ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl
                          flex flex-col shadow-2xl max-h-[90vh]">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
              <h2 className="font-syne font-bold text-[16px]">
                {modal === 'edit' ? '템플릿 수정' : '새 템플릿 추가'}
              </h2>
              <button onClick={() => setModal(null)}
                className="text-sand/30 hover:text-sand transition-colors cursor-pointer text-xl leading-none">
                ✕
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-white/[0.07] px-6 flex-shrink-0">
              {([
                { key: 'basic',  label: '① 기본 정보'   },
                { key: 'detail', label: '② 상세 구성'   },
                { key: 'files',  label: '③ 파일 & 설정' },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-3 text-[13px] border-b-2 transition-all cursor-pointer
                    ${tab === key
                      ? 'text-sand font-medium border-lime'
                      : 'text-sand/40 border-transparent hover:text-sand/70'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* 모달 바디 */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── 기본 정보 탭 ── */}
              {tab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="템플릿 이름 *" error={errors.name}>
                      <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)}
                        placeholder="Lumina SaaS Kit" className={input(errors.name)} />
                    </Field>
                    <Field label="Slug (URL) *" error={errors.slug}>
                      <input value={form.slug ?? ''}
                        onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder="lumina-saas-kit" className={input(errors.slug)} />
                    </Field>
                  </div>

                  <Field label="설명 *" error={errors.description}>
                    <textarea rows={3} value={form.description ?? ''}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="템플릿에 대한 간결한 설명을 입력하세요"
                      className={input(errors.description) + ' resize-none'} />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="카테고리">
                      <select value={form.category ?? 'landing'}
                        onChange={(e) => set('category', e.target.value as TemplateCategory)}
                        className={input()}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="뱃지">
                      <select value={form.badge ?? ''}
                        onChange={(e) => set('badge', (e.target.value || undefined) as any)}
                        className={input()}>
                        <option value="">없음</option>
                        {BADGES.map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="기술 스택">
                    <div className="flex gap-2 flex-wrap mt-1">
                      {STACKS.map((s) => (
                        <button key={s} onClick={() => toggleStack(s)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer
                            ${(form.stack ?? []).includes(s)
                              ? 'bg-lime/10 border-lime/30 text-lime'
                              : 'bg-transparent border-white/10 text-sand/50 hover:border-white/25'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="판매 가격 (원)" error={errors.price}>
                      <input type="number" value={form.price ?? 0}
                        onChange={(e) => set('price', Number(e.target.value))}
                        placeholder="29000" className={input(errors.price)} />
                    </Field>
                    <Field label="원래 가격 (원)">
                      <input type="number" value={form.original_price ?? 0}
                        onChange={(e) => set('original_price', Number(e.target.value))}
                        placeholder="49000" className={input()} />
                    </Field>
                  </div>

                  <Field label="미리보기 URL *" error={errors.preview_url}>
                    <input value={form.preview_url ?? ''}
                      onChange={(e) => set('preview_url', e.target.value)}
                      placeholder="https://demo.example.com" className={input(errors.preview_url)} />
                  </Field>
                </div>
              )}

              {/* ── 상세 구성 탭 ── */}
              {tab === 'detail' && (
                <div className="space-y-6">
                  <ArrayField
                    label="포함 기능 목록"
                    sub="예: 히어로 섹션 (타이핑 애니메이션), 다크모드 지원"
                    items={form.features ?? []}
                    onAdd={(v) => addArrayItem('features', v)}
                    onRemove={(i) => removeArrayItem('features', i)}
                    placeholder="기능 입력 후 Enter"
                  />
                  <ArrayField
                    label="섹션 구성"
                    sub="예: 히어로, 가격표, FAQ, 푸터"
                    items={form.sections ?? []}
                    onAdd={(v) => addArrayItem('sections', v)}
                    onRemove={(i) => removeArrayItem('sections', i)}
                    placeholder="섹션 이름 입력 후 Enter"
                  />
                </div>
              )}

              {/* ── 파일 & 설정 탭 ── */}
              {tab === 'files' && (
                <div className="space-y-5">

                  {/* 썸네일 이미지 */}
                  <div>
                    <p className="text-[12px] text-sand/45 mb-2 font-medium">
                      썸네일 이미지 <span className="text-sand/25 font-normal">(JPG·PNG·WebP, 5MB 이하)</span>
                    </p>
                    {(thumbPreview || form.thumbnail_url) && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 mb-2">
                        <img src={thumbPreview || form.thumbnail_url} alt="썸네일 미리보기"
                          className="w-full h-full object-cover object-top" />
                        <button
                          onClick={() => { setThumbPreview(null); set('thumbnail_url', '') }}
                          className="absolute top-2 right-2 bg-black/60 text-sand/60 hover:text-[#ff5f3f]
                                     border border-white/10 rounded-lg px-2 py-1 text-[11px] cursor-pointer">
                          ✕ 제거
                        </button>
                      </div>
                    )}
                    <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-6
                                       cursor-pointer transition-all
                                       ${uploadingThumb
                                         ? 'border-lime/40 bg-lime/[0.04] pointer-events-none'
                                         : 'border-white/10 hover:border-lime/30 hover:bg-lime/[0.02]'}`}>
                      {uploadingThumb ? (
                        <div className="flex items-center gap-2 text-sand/50 text-[13px]">
                          <div className="w-4 h-4 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                          업로드 중...
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl">🖼</span>
                          <span className="text-[13px] text-sand/40">클릭하거나 이미지를 여기에 드래그해요</span>
                          <span className="text-[11px] text-sand/25">권장 크기: 1200×800px</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f) }} />
                    </label>
                    <input value={form.thumbnail_url ?? ''}
                      onChange={(e) => { set('thumbnail_url', e.target.value); setThumbPreview(e.target.value) }}
                      placeholder="또는 URL 직접 입력"
                      className="w-full mt-2 bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-3 py-2
                                 text-[12px] text-sand/50 placeholder:text-sand/20
                                 outline-none focus:border-lime/30 transition-colors" />
                  </div>

                  {/* 소스코드 ZIP */}
                  <div>
                    <p className="text-[12px] text-sand/45 mb-2 font-medium">
                      소스코드 ZIP <span className="text-sand/25 font-normal">(ZIP만 가능, 200MB 이하)</span>
                    </p>
                    <label className={`flex ${form.download_url ? 'items-center gap-4 px-5 py-4' : 'flex-col items-center gap-2 p-6'}
                                       border-2 border-dashed rounded-xl cursor-pointer transition-all
                                       ${uploadingZip
                                         ? 'border-lime/40 bg-lime/[0.04] pointer-events-none'
                                         : form.download_url
                                         ? 'border-teal/30 bg-teal/[0.04]'
                                         : 'border-white/10 hover:border-lime/30 hover:bg-lime/[0.02]'}`}>
                      {uploadingZip ? (
                        <div className="flex items-center gap-2 text-sand/50 text-[13px]">
                          <div className="w-4 h-4 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                          업로드 중...
                        </div>
                      ) : form.download_url ? (
                        <>
                          <span className="text-xl">🗜</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-teal truncate">{form.download_url}</p>
                            <p className="text-[11px] text-sand/30 mt-0.5">
                              {form.file_size_kb ? `${(form.file_size_kb / 1024).toFixed(1)} MB` : '크기 확인 중'}
                            </p>
                          </div>
                          <span className="text-[11px] text-teal border border-teal/25 rounded-lg px-2 py-1 flex-shrink-0">
                            ✓ 업로드됨
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🗜</span>
                          <div className="text-center">
                            <p className="text-[13px] text-sand/40">ZIP 파일을 업로드하거나 드래그해요</p>
                            <p className="text-[11px] text-sand/25 mt-0.5">slug가 파일명으로 사용돼요</p>
                          </div>
                        </>
                      )}
                      <input type="file" accept=".zip" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadZip(f) }} />
                    </label>
                    <input value={form.download_url ?? ''}
                      onChange={(e) => set('download_url', e.target.value)}
                      placeholder="또는 Storage 경로 직접 입력 (예: lumina-saas-kit.zip)"
                      className="w-full mt-2 bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-3 py-2
                                 text-[12px] text-sand/50 placeholder:text-sand/20
                                 outline-none focus:border-lime/30 transition-colors" />
                  </div>

                  {/* 가이드 PDF + 라이선스 TXT */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[12px] text-sand/45 mb-2 font-medium">설치 가이드 PDF</p>
                      <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4
                                         cursor-pointer transition-all
                                         ${uploadingGuide
                                           ? 'border-lime/40 bg-lime/[0.04] pointer-events-none'
                                           : 'border-white/10 hover:border-lime/30 hover:bg-lime/[0.02]'}`}>
                        {uploadingGuide ? (
                          <div className="flex items-center gap-2 text-sand/50 text-[12px]">
                            <div className="w-3 h-3 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                            업로드 중...
                          </div>
                        ) : (
                          <>
                            <span className="text-xl">📄</span>
                            <span className="text-[12px] text-sand/35">PDF 업로드</span>
                          </>
                        )}
                        <input type="file" accept=".pdf" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGuide(f) }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-[12px] text-sand/45 mb-2 font-medium">라이선스 파일</p>
                      <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4
                                         cursor-pointer transition-all
                                         ${uploadingLicense
                                           ? 'border-lime/40 bg-lime/[0.04] pointer-events-none'
                                           : 'border-white/10 hover:border-lime/30 hover:bg-lime/[0.02]'}`}>
                        {uploadingLicense ? (
                          <div className="flex items-center gap-2 text-sand/50 text-[12px]">
                            <div className="w-3 h-3 border-2 border-lime/30 border-t-lime rounded-full animate-spin" />
                            업로드 중...
                          </div>
                        ) : (
                          <>
                            <span className="text-xl">📋</span>
                            <span className="text-[12px] text-sand/35">TXT 업로드</span>
                          </>
                        )}
                        <input type="file" accept=".txt" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLicense(f) }} />
                      </label>
                    </div>
                  </div>

                  {/* 파일 크기 + 평점 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="파일 크기 (KB)">
                      <input type="number" value={form.file_size_kb ?? 0}
                        onChange={(e) => set('file_size_kb', Number(e.target.value))}
                        placeholder="ZIP 업로드 시 자동 입력" className={input()} />
                      {!!form.file_size_kb && (
                        <p className="text-[11px] text-sand/25 mt-1">
                          ≈ {(form.file_size_kb / 1024).toFixed(1)} MB
                        </p>
                      )}
                    </Field>
                    <Field label="평점">
                      <input type="number" min="1" max="5" step="0.1"
                        value={form.rating ?? 5.0}
                        onChange={(e) => set('rating', Number(e.target.value))}
                        placeholder="4.9" className={input()} />
                    </Field>
                  </div>

                  {/* 공개 여부 */}
                  <Field label="공개 여부">
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => set('is_published', !form.is_published)}
                        className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative
                          ${form.is_published ? 'bg-lime' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                          ${form.is_published ? 'left-[26px]' : 'left-0.5'}`} />
                      </button>
                      <span className="text-[13px] text-sand/60">
                        {form.is_published ? '공개 — 스토어에 노출됩니다' : '비공개 — 스토어에 노출되지 않습니다'}
                      </span>
                    </div>
                  </Field>

                  {/* 미리보기 요약 */}
                  <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4">
                    <p className="font-syne font-bold text-[12px] text-sand/30 uppercase tracking-wider mb-3">입력 요약</p>
                    <div className="space-y-2 text-[12px]">
                      {[
                        { k: '이름',     v: form.name || '—' },
                        { k: 'Slug',     v: form.slug || '—' },
                        { k: '카테고리', v: form.category || '—' },
                        { k: '스택',     v: form.stack?.join(', ') || '—' },
                        { k: '판매가',   v: form.price ? `₩${form.price.toLocaleString()}` : '무료' },
                        { k: '기능 수',  v: `${form.features?.length ?? 0}개` },
                        { k: '섹션 수',  v: `${form.sections?.length ?? 0}개` },
                        { k: '공개',     v: form.is_published ? '✓ 공개' : '✗ 비공개' },
                      ].map(({ k, v }) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-sand/40">{k}</span>
                          <span className="text-sand/70">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Storage 안내 */}
                  <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-4 text-[12px] text-sand/35 space-y-1.5">
                    <p className="font-medium text-sand/50 mb-2">📦 Supabase Storage 버킷 구조</p>
                    <p><span className="text-sand/50 font-mono">thumbnails/</span> — 썸네일 이미지 (Public 버킷)</p>
                    <p><span className="text-sand/50 font-mono">templates/</span> — ZIP·PDF·TXT (Private 버킷)</p>
                    <p className="mt-2 text-sand/25">slug를 먼저 입력해야 파일명이 slug 기준으로 저장돼요.</p>
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.07] flex-shrink-0">
              <div className="flex gap-2">
                {(['basic', 'detail', 'files'] as const).map((t) => (
                  <div key={t} className={`w-2 h-2 rounded-full transition-colors
                    ${tab === t ? 'bg-lime' : 'bg-white/15'}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)}
                  className="border border-white/10 rounded-xl px-5 py-2.5 text-[13px]
                             text-sand/50 hover:text-sand transition-colors cursor-pointer">
                  취소
                </button>
                {tab !== 'files' && (
                  <button onClick={() => setTab(tab === 'basic' ? 'detail' : 'files')}
                    className="border border-white/20 rounded-xl px-5 py-2.5 text-[13px]
                               text-sand/70 hover:text-sand transition-colors cursor-pointer">
                    다음 →
                  </button>
                )}
                <button onClick={handleSave} disabled={saving}
                  className="bg-lime text-ink font-syne font-bold rounded-xl px-5 py-2.5
                             text-[13px] hover:opacity-85 transition-opacity cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? '저장 중...' : modal === 'edit' ? '수정 완료' : '추가하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-80">
            <h3 className="font-syne font-bold text-[16px] mb-2">정말 삭제할까요?</h3>
            <p className="text-[13px] text-sand/45 mb-6">
              삭제하면 되돌릴 수 없어요. 연결된 주문이 있으면 삭제가 안 될 수 있어요.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-white/10 rounded-xl py-2.5 text-[13px]
                           text-sand/50 hover:text-sand transition-colors cursor-pointer">
                취소
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-[#ff5f3f] text-white rounded-xl py-2.5 text-[13px]
                           font-medium hover:opacity-85 transition-opacity cursor-pointer">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 공통 컴포넌트 ─────────────────────────────────────────

function input(error?: string) {
  return `w-full bg-[#0d0d0d] border rounded-xl px-4 py-3 text-[14px] text-sand
          placeholder:text-sand/20 outline-none transition-colors
          ${error ? 'border-[#ff5f3f]/40 focus:border-[#ff5f3f]/70' : 'border-white/10 focus:border-lime/40'}`
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-[12px] text-sand/45 mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-[11px] text-[#ff5f3f] mt-1">{error}</p>}
    </div>
  )
}

function ArrayField({ label, sub, items, onAdd, onRemove, placeholder }: {
  label: string; sub: string
  items: string[]
  onAdd: (v: string) => void
  onRemove: (i: number) => void
  placeholder: string
}) {
  const [val, setVal] = useState('')

  function handleAdd() {
    if (!val.trim()) return
    onAdd(val)
    setVal('')
  }

  return (
    <div>
      <label className="text-[12px] text-sand/45 mb-0.5 block">{label}</label>
      <p className="text-[11px] text-sand/25 mb-2">{sub}</p>
      <div className="flex gap-2 mb-3">
        <input value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5
                     text-[13px] text-sand placeholder:text-sand/20 outline-none
                     focus:border-lime/40 transition-colors" />
        <button onClick={handleAdd}
          className="bg-lime/10 border border-lime/25 text-lime rounded-xl px-4 py-2.5
                     text-[13px] hover:bg-lime/20 transition-colors cursor-pointer">
          + 추가
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-sand/20 text-center py-4 border border-dashed border-white/[0.08] rounded-xl">
          아직 추가된 항목이 없어요
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06]
                                    rounded-lg px-3 py-2">
              <span className="text-lime text-[11px] flex-shrink-0">✓</span>
              <span className="text-[13px] text-sand/70 flex-1">{item}</span>
              <button onClick={() => onRemove(i)}
                className="text-sand/25 hover:text-[#ff5f3f] transition-colors cursor-pointer text-[15px]">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}