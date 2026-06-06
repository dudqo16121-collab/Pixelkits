import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'lime' | 'teal' | 'hot' | 'gray'
  className?: string
}

const VARIANTS = {
  lime: 'bg-lime/10 border-lime/20 text-lime',
  teal: 'bg-teal/10 border-teal/20 text-teal',
  hot:  'bg-[#ff5f3f]/15 border-[#ff5f3f]/20 text-[#ff5f3f]',
  gray: 'bg-white/[0.07] border-white/10 text-sand/60',
}

export function Badge({ children, variant = 'lime', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 border rounded-full text-[11px] font-medium px-2.5 py-1',
      VARIANTS[variant],
      className
    )}>
      {children}
    </span>
  )
}
