import { supabase } from './supabase'
import type { Template } from '@/types'

// 전체 템플릿 조회
export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

// slug로 단일 템플릿 조회
export async function getTemplateBySlug(slug: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) { console.error(error); return null }
  return data
}

// 카테고리 + 검색 필터
export async function filterTemplates(
  category?: string,
  query?: string,
  stacks?: string[],      // ← 추가
  maxPrice?: number,      // ← 추가
): Promise<Template[]> {
  let req = supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)

  if (category && category !== 'all') {
    req = req.eq('category', category)
  }
  if (query) {
    req = req.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }
  if (maxPrice !== undefined && maxPrice < 50000) {
    req = req.lte('price', maxPrice)
  }

  const { data, error } = await req.order('download_count', { ascending: false })
  if (error) { console.error(error); return [] }

  let result = data ?? []

  // 스택 필터 — Supabase에서 배열 필터가 복잡해서 클라이언트에서 처리
  if (stacks && stacks.length > 0) {
    const normalizedStacks = stacks.map((s) => s.toLowerCase().replace(/[^a-z]/g, ''))
    result = result.filter((t) =>
      t.stack?.some((s: string) =>
        normalizedStacks.some((ns) => s.toLowerCase().replace(/[^a-z]/g, '').includes(ns))
      )
    )
  }

  return result
}