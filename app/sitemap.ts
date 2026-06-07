import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const BASE_URL = 'https://pixelkits.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── 정적 페이지 ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              BASE_URL,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/templates`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/about`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${BASE_URL}/faq`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${BASE_URL}/terms`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${BASE_URL}/privacy`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${BASE_URL}/refund`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ]

  // ── 동적 템플릿 페이지 ───────────────────────────────
  const { data: templates } = await supabase
    .from('templates')
    .select('slug, updated_at')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })

  const templatePages: MetadataRoute.Sitemap = (templates ?? []).map((t) => ({
    url:             `${BASE_URL}/templates/${t.slug}`,
    lastModified:    new Date(t.updated_at),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }))

  return [...staticPages, ...templatePages]
}