import { notFound } from 'next/navigation'
import { getTemplateBySlug } from '@/lib/templates'
import { PreviewClient } from './PreviewClient'
import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await getTemplateBySlug(params.slug)
  if (!template) return { title: '미리보기 — pixelkits' }
  return {
    title:  `${template.name} 미리보기`,
    robots: { index: false, follow: false }, // 미리보기 페이지는 색인 제외
  }
}

export default async function PreviewPage({ params }: Props) {
  const template = await getTemplateBySlug(params.slug)
  if (!template) notFound()

  return (
    <div className="h-screen flex flex-col bg-ink overflow-hidden">

      {/* ── 상단 툴바 ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-panel
                      border-b border-white/[0.07] flex-shrink-0 z-20 relative">

        {/* 왼쪽: 돌아가기 + 템플릿 이름 */}
        <div className="flex items-center gap-4">
          <Link
            href={`/templates/${template.slug}`}
            className="flex items-center gap-1.5 text-[13px] text-sand/50
                       hover:text-sand transition-colors"
          >
            ← 돌아가기
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <span className="font-syne font-bold text-[14px] truncate max-w-[200px]">
            {template.name}
          </span>
          <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/20
                           rounded-full px-2 py-0.5 animate-pulse">
            ● LIVE
          </span>
        </div>

        {/* 오른쪽: 디바이스 토글 + 구매 버튼 (클라이언트) */}
        <PreviewClient
          slug={template.slug}
          previewUrl={template.preview_url}
          thumbnailUrl={template.thumbnail_url ?? null}
          price={template.price}
          templateName={template.name}
        />
      </div>

      {/* ── iframe 영역 (PreviewClient가 fixed로 채움) ── */}
    </div>
  )
}