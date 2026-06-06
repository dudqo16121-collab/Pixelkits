'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getReviews, submitReview, hasReviewed,
  hasPurchased, deleteReview, calcAvgRating,
  isAdminUser,
  type Review,
} from '@/lib/reviews'

interface Props {
  templateId: string
}

function StarRating({
  value, onChange, readonly = false,
}: {
  value: number; onChange?: (v: number) => void; readonly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((star) => (
        <button key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl transition-colors
            ${readonly ? 'cursor-default' : 'cursor-pointer'}
            ${star <= (hover || value) ? 'text-lime' : 'text-white/15'}`}>
          ★
        </button>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function ReviewSection({ templateId }: Props) {
  const [reviews,    setReviews]    = useState<Review[]>([])
  const [loading,    setLoading]    = useState(true)
  const [userId,     setUserId]     = useState<string | null>(null)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [purchased,  setPurchased]  = useState(false)
  const [orderId,    setOrderId]    = useState<string | undefined>()
  const [reviewed,   setReviewed]   = useState(false)
  const [showForm,   setShowForm]   = useState(false)
  const [rating,     setRating]     = useState(5)
  const [content,    setContent]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg,  setSubmitMsg]  = useState('')

useEffect(() => {
  loadAll()

  // Realtime 구독 — 해당 템플릿 후기 변경 감지
  const channel = supabase
    .channel(`reviews-${templateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',           // insert, update, delete 모두
        schema: 'public',
        table: 'reviews',
        filter: `template_id=eq.${templateId}`,
      },
      () => {
        // 변경 감지 시 후기 목록 새로 불러오기
        loadAll()
      }
    )
    .subscribe()

  // 컴포넌트 언마운트 시 구독 해제
  return () => {
    supabase.removeChannel(channel)
  }
}, [templateId])

  async function loadAll() {
    setLoading(true)

    // 후기 목록
    const data = await getReviews(templateId)
    setReviews(data)

    // 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)

      // 관리자 여부 확인
      const admin = await isAdminUser(user.id)
      setIsAdmin(admin)

      if (admin) {
        // 관리자는 구매 없이 후기 작성 가능
        setPurchased(true)
      } else {
        const { purchased: p, orderId: oid } = await hasPurchased(user.id, templateId)
        setPurchased(p)
        setOrderId(oid)
      }

      const already = await hasReviewed(user.id, templateId)
      setReviewed(already)
    }

    setLoading(false)
  }

  async function handleSubmit() {
    if (!userId || !content.trim()) return
    if (!isAdmin && !orderId) return
    setSubmitting(true)

    const { success, error } = await submitReview({
      userId,
      templateId,
      orderId: isAdmin ? undefined : orderId,
      rating,
      content,
    })

    if (success) {
      setSubmitMsg('후기가 등록됐어요! 감사합니다 🎉')
      setShowForm(false)
      setContent('')
      setRating(5)
      setReviewed(true)
      await loadAll()
    } else {
      setSubmitMsg('오류가 발생했어요: ' + error)
    }
    setSubmitting(false)
    setTimeout(() => setSubmitMsg(''), 4000)
  }

  async function handleDelete(reviewId: string) {
    if (!confirm('후기를 삭제할까요?')) return
    await deleteReview(reviewId)
    await loadAll()
    setReviewed(false)
  }

  const avg = calcAvgRating(reviews)
  const dist = [5,4,3,2,1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }))

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-sand/30">
      <div className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full animate-spin mr-2" />
      후기 불러오는 중...
    </div>
  )

  return (
    <div>
      {/* ── 평점 요약 ── */}
      <div className="flex gap-8 items-start mb-8 p-6 card-base rounded-2xl">
        {/* 평균 평점 */}
        <div className="text-center flex-shrink-0 min-w-[80px]">
          <p className="font-syne font-extrabold text-5xl text-lime mb-1">
            {avg > 0 ? avg.toFixed(1) : '—'}
          </p>
          <StarRating value={Math.round(avg)} readonly />
          <p className="text-[12px] text-sand/35 mt-1">{reviews.length}개 후기</p>
        </div>

        {/* 별점 분포 */}
        <div className="flex-1 space-y-1.5 py-1">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-[12px]">
              <span className="text-sand/40 w-3 text-right">{star}</span>
              <span className="text-lime text-[11px]">★</span>
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime/70 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sand/35 w-4 text-right">{count}</span>
            </div>
          ))}
        </div>

        {/* 후기 작성 버튼 */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center">
          {!userId ? (
            <a href="/login"
              className="text-[13px] text-lime border border-lime/25 bg-lime/[0.08]
                         rounded-xl px-4 py-2.5 hover:bg-lime/15 transition-colors text-center">
              로그인 후 작성
            </a>
          ) : !purchased ? (
            <div className="text-center">
              <p className="text-[12px] text-sand/35 mb-2">구매자만 작성할 수 있어요</p>
              <a href={`/checkout?template=${templateId}`}
                className="text-[13px] text-lime hover:opacity-75 transition-opacity">
                구매하러 가기 →
              </a>
            </div>
          ) : reviewed ? (
            <p className="text-[13px] text-sand/40 text-center">
              ✓ 후기를 작성하셨어요
            </p>
          ) : (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-lime text-ink font-syne font-bold text-[13px] rounded-xl
                         px-5 py-2.5 hover:opacity-85 transition-opacity cursor-pointer
                         flex items-center gap-2">
              ✏ 후기 작성하기
              {isAdmin && (
                <span className="text-[10px] bg-ink/30 px-1.5 py-0.5 rounded-full">관리자</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── 후기 작성 폼 ── */}
      {showForm && (
        <div className="card-base rounded-2xl p-6 mb-6 border-lime/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-[15px]">후기 작성</h3>
            {isAdmin && (
              <span className="text-[11px] bg-lime/10 border border-lime/20 text-lime
                               px-2.5 py-1 rounded-full">
                🔧 관리자 테스트 모드
              </span>
            )}
          </div>

          <div className="mb-4">
            <label className="text-[12px] text-sand/45 mb-2 block">별점</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="mb-5">
            <label className="text-[12px] text-sand/45 mb-1.5 block">후기 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="이 템플릿을 사용한 경험을 공유해주세요. 코드 품질, 커스터마이징 편의성, 디자인 퀄리티 등을 자유롭게 작성해주세요."
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3
                         text-[14px] text-sand placeholder:text-sand/20 outline-none
                         focus:border-lime/40 transition-colors resize-none"
            />
            <p className="text-[11px] text-sand/25 mt-1 text-right">
              {content.length} / 500자
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setContent(''); setRating(5) }}
              className="flex-1 border border-white/10 rounded-xl py-2.5 text-[13px]
                         text-sand/50 hover:text-sand transition-colors cursor-pointer">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="flex-1 bg-lime text-ink font-syne font-bold rounded-xl py-2.5
                         text-[13px] hover:opacity-85 transition-opacity cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? '등록 중...' : '후기 등록'}
            </button>
          </div>
        </div>
      )}

      {/* 제출 메시지 */}
      {submitMsg && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-[13px] border
          ${submitMsg.includes('감사')
            ? 'bg-teal/[0.08] border-teal/20 text-teal'
            : 'bg-[#ff5f3f]/10 border-[#ff5f3f]/20 text-[#ff5f3f]'}`}>
          {submitMsg}
        </div>
      )}

      {/* ── 후기 목록 ── */}
      {reviews.length === 0 ? (
        <div className="text-center py-14 text-sand/30">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-[14px] mb-1">아직 후기가 없어요</p>
          <p className="text-[12px]">첫 번째 후기를 작성해보세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card-base rounded-2xl p-5
                                            hover:border-white/14 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {/* 아바타 */}
                  <div className="w-9 h-9 rounded-full bg-lime/12 border border-lime/25
                                  flex items-center justify-center font-syne font-bold
                                  text-lime text-[13px] flex-shrink-0">
                    {review.profiles?.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium">
                        {review.profiles?.name ?? '익명'}
                      </p>
                      {/* 구매 인증 뱃지 */}
                      <span className="flex items-center gap-1 text-[10px] font-bold
                                       bg-teal/10 border border-teal/20 text-teal
                                       px-2 py-0.5 rounded-full">
                        ✓ 구매 인증
                      </span>
                    </div>
                    <p className="text-[11px] text-sand/30 mt-0.5">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StarRating value={review.rating} readonly />
                  {/* 본인 후기 또는 관리자 삭제 */}
                  {(userId === review.user_id || isAdmin) && (
                    <button onClick={() => handleDelete(review.id)}
                      className="text-[11px] text-sand/25 hover:text-[#ff5f3f]
                                 transition-colors cursor-pointer">
                      삭제
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[13px] text-sand/65 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}