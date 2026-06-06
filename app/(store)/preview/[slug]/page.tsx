import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTemplateBySlug } from '@/lib/templates'
import { PreviewClient } from './PreviewClient'

interface Props {
  params: { slug: string }
}

export default function PreviewPage({ params }: Props) {
  const template = getTemplateBySlug(params.slug)
  if (!template) notFound()

  return (
    <div className="h-screen flex flex-col bg-ink overflow-hidden">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between px-5 py-3 bg-panel border-b border-white/[0.07] flex-shrink-0 z-20 relative">
        {/* 왼쪽: 돌아가기 + 템플릿 이름 */}
        <div className="flex items-center gap-4">
          <Link
            href={`/templates/${template.slug}`}
            className="flex items-center gap-1.5 text-[13px] text-sand/50 hover:text-sand transition-colors">
            ← 돌아가기
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <span className="font-syne font-bold text-[14px] truncate max-w-[200px]">
            {template.name}
          </span>
          <span className="badge-lime text-[10px] px-2 py-0.5 animate-pulse">● LIVE</span>
        </div>

        {/* 가운데 + 오른쪽: 디바이스 토글 + 구매 버튼 */}
        <PreviewClient
          slug={template.slug}
          previewUrl={template.preview_url}
          price={template.price}
        />
      </div>
    </div>
  )
}
