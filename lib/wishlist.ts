import { supabase } from './supabase'

export async function getWishlist(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('wishlists')
    .select('template_id')
    .eq('user_id', userId)
  return data?.map((w) => w.template_id) ?? []
}

export async function toggleWishlist(userId: string, templateId: string): Promise<boolean> {
  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .single()

  if (data) {
    await supabase.from('wishlists').delete()
      .eq('user_id', userId).eq('template_id', templateId)
    return false
  } else {
    await supabase.from('wishlists').insert({ user_id: userId, template_id: templateId })
    return true
  }
}
