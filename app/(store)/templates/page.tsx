import type { Metadata } from 'next'
import { TemplatesClient } from './TemplatesClient'

export const metadata: Metadata = {
  title:       '템플릿 목록',
  description: 'Next.js, React, Vue.js 기반 프론트엔드 템플릿. 카테고리별·스택별로 빠르게 찾아보세요.',
  openGraph: {
    title:       '템플릿 목록 — pixelkits',
    description: 'Next.js, React, Vue.js 기반 프론트엔드 템플릿.',
  },
}

export default function TemplatesPage() {
  return <TemplatesClient />
}