import { supabase } from './supabase'
import type { Template } from '@/types'

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

// ← supabaseAdmin 제거, 클라이언트용 supabase만 사용
export async function getTemplateBySlug(slug: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) { console.error(error); return null }
  return data
}

export async function filterTemplates(
  category?: string,
  query?:    string,
  stacks?:   string[],
  maxPrice?: number,
): Promise<Template[]> {
  let req = supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)

  if (category && category !== 'all') {
    req = req.eq('category', category)
  }

  if (query && query.trim()) {
    const q = query.trim()
    if (q.length >= 2) {
      req = req.textSearch('fts', q, { type: 'plain', config: 'simple' })
    } else {
      req = req.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }
  }

  if (maxPrice !== undefined && maxPrice < 100000) {
    req = req.lte('price', maxPrice)
  }

  if (stacks && stacks.length > 0) {
    req = req.overlaps('stack', stacks)
  }

  const { data, error } = await req.order('download_count', { ascending: false })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getTemplatesBySlugs(slugs: string[]): Promise<Template[]> {
  if (slugs.length === 0) return []
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .in('slug', slugs)
    .eq('is_published', true)

  if (error) { console.error(error); return [] }
  return data ?? []
}