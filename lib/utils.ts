import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 클래스 병합 (조건부 클래스 적용 시 사용)
// 예: cn('px-4 py-2', isActive && 'bg-lime', className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷 (0 → "무료", 29000 → "₩29,000")
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return '—'
  if (price === 0) return '무료'
  return '₩' + price.toLocaleString('ko-KR')
}

// 할인율 계산
export function discountPercent(original: number, sale: number): number {
  if (original <= 0) return 0
  return Math.round(((original - sale) / original) * 100)
}

// 주문번호 생성 (PKT-YYYYMMDD-XXXX)
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `PKT-${date}-${rand}`
}

// 파일 크기 포맷 (1024 → "1.0 MB")
export function formatFileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

// 날짜 포맷 (ISO → "2026.06.05")
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\. /g, '.').replace('.', '')
}
