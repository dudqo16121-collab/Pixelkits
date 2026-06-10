import { supabaseAdmin } from './supabase-admin'
import type { Template } from '@/types'

// 서버 컴포넌트, API Route에서만 import할 것
export async function getTemplateBySlugServer(slug: string): Promise<Template | null> {
  const { data, error } = await supabaseAdmin
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) { console.error(error); return null }
  return data
}