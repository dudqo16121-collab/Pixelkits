import Link from 'next/link'
import { cn, formatPrice, discountPercent } from '@/lib/utils'
import type { Template } from '@/types'

interface TemplateCardProps {
  template: Template
  className?: string
}

const BADGE_STYLES: Record<string, string> = {
  new:  'bg-lime text-ink',
  hot:  'bg-[#ff5f3f] text-white',
  free: 'bg-teal text-[#04342c]',
  sale: 'bg-amber-500 text-amber-950',
}

export function TemplateCard({ template, className }: TemplateCardProps) {
  const discount = discountPercent(template.original_price, template.price)

  return (
    <Link
      href={`/templates/${template.slug}`}
      className={cn(
        'card-base overflow-hidden group cursor-pointer block',
        'transition-transform duration-200 hover:-translate-y-1',
        'hover:border-white/[0.18]',
        className
      )}
    >
      {/* 썸네일 영역 */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#0d1b2a] to-[#1e3a5f]">
        {template.thumbnail_url ? (
          // 썸네일 이미지가 있으면 실제 이미지
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // 없으면 미니 목업 UI
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[82%] h-[78%] bg-white/[0.04] border border-white/[0.09] rounded-md overflow-hidden flex flex-col">
              <div className="h-4 bg-white/[0.05] flex items-center gap-1 px-2">
                {['#ff5f57','#febc2e','#28c840'].map((c) => (
                  <span key={c} className="w-[5px] h-[5px] rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 p-2 flex flex-col gap-1">
                <div className="h-5 bg-white/[0.07] rounded" />
                <div className="flex gap-1 flex-1">
                  <div className="flex-1 bg-white/[0.05] rounded" />
                  <div className="flex-1 bg-white/[0.05] rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 뱃지 */}
        {template.badge && (
          <span className={cn(
            'absolute top-2 right-2 text-[10px] font-syne font-bold px-2 py-0.5 rounded-full',
            BADGE_STYLES[template.badge]
          )}>
            {template.badge.toUpperCase()}
          </span>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-3 pb-4">
        <p className="text-[10px] text-sand/30 uppercase tracking-[0.8px] mb-1">
          {template.category}
        </p>
        <h3 className="font-syne font-bold text-[13px] mb-2 leading-snug">
          {template.name}
        </h3>

        {/* 스택 태그 */}
        <div className="flex gap-1 flex-wrap mb-2">
          {template.stack?.map((s) => (
            <span key={s} className="text-[10px] text-sand/35 bg-white/[0.05] rounded px-1.5 py-0.5">
              {s}
            </span>
          ))}
        </div>

        {/* 가격 + 평점 */}
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-[13px] font-medium',
            template.price === 0 ? 'text-teal' : 'text-lime'
          )}>
            {formatPrice(template.price)}
            {discount > 0 && (
              <span className="ml-1.5 text-[11px] text-sand/30 line-through">
                {formatPrice(template.original_price)}
              </span>
            )}
          </span>
<div className="flex items-center gap-2 text-[11px] text-sand/30">
  <span className="flex items-center gap-0.5">
    ★ {template.rating ?? 0}
    <span className="ml-1 text-sand/20">({template.review_count ?? 0})</span>
  </span>
  <span className="text-sand/15">·</span>
  <span className="flex items-center gap-0.5">
    ⬇ {(template.download_count ?? 0).toLocaleString()}
  </span>
</div>
        </div>
      </div>
    </Link>
  )
}