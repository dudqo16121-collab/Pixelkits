import { supabase } from './supabase'

export interface Review {
  id: string
  user_id: string
  template_id: string
  order_id: string
  rating: number
  content: string
  created_at: string
  profiles?: { name: string | null }
}

// 템플릿 후기 조회
export async function getReviews(templateId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(name)')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReviews error:', error)
    return []
  }
  return data ?? []
}

// 평균 평점 계산
export function calcAvgRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

// 현재 유저가 이미 후기를 작성했는지 확인
export async function hasReviewed(
  userId: string, templateId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .maybeSingle()  // ← single() 대신 maybeSingle() 사용

  if (error) { console.error('hasReviewed error:', error); return false }
  return !!data
}

// 현재 유저가 해당 템플릿을 구매했는지 확인
export async function hasPurchased(
  userId: string, templateId: string
): Promise<{ purchased: boolean; orderId?: string }> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .eq('status', 'completed')
    .maybeSingle()  // ← single() 대신 maybeSingle() 사용

  if (error) { console.error('hasPurchased error:', error); return { purchased: false } }
  return { purchased: !!data, orderId: data?.id }
}

// 관리자 여부 확인
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()  // ← single() 대신 maybeSingle() 사용

  if (error) { console.error('isAdminUser error:', error); return false }
  return data?.is_admin ?? false
}

// 후기 작성
export async function submitReview(payload: {
  userId: string
  templateId: string
  orderId?: string   // ← optional로 변경
  rating: number
  content: string
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('reviews').insert({
    user_id:     payload.userId,
    template_id: payload.templateId,
    order_id:    payload.orderId ?? null,   // ← null 허용
    rating:      payload.rating,
    content:     payload.content,
  })
  if (error) {
    console.error('submitReview error:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// 후기 삭제
export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
  if (error) { console.error('deleteReview error:', error); return false }
  return true
}