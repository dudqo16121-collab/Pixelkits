import { supabase } from './supabase'

// 내 찜 목록 조회
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlist')
    .select('template_id, templates(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return (data ?? []).map((row: any) => row.templates)
}

// 찜 여부 확인
export async function getWishedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('wishlist')
    .select('template_id')
    .eq('user_id', userId)

  return new Set((data ?? []).map((r: any) => r.template_id))
}

// 찜 추가
export async function addWish(userId: string, templateId: string) {
  await supabase.from('wishlist').insert({ user_id: userId, template_id: templateId })
}

// 찜 제거
export async function removeWish(userId: string, templateId: string) {
  await supabase.from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('template_id', templateId)
}

// 토글 (있으면 제거, 없으면 추가)
export async function toggleWish(userId: string, templateId: string): Promise<boolean> {
  const { data } = await supabase
    .from('wishlist')
    .select('template_id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .maybeSingle()

  if (data) {
    await removeWish(userId, templateId)
    return false  // 찜 해제됨
  } else {
    await addWish(userId, templateId)
    return true   // 찜 추가됨
  }
}