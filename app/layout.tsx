import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { UserProvider } from '@/lib/UserContext'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-syne',
})

const dm = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
})

const BASE_URL = 'https://pixelkits.co'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),  // ← 상대경로 OG 이미지 자동 절대경로 변환
  title: {
    default:  'pixelkits — 프론트엔드 템플릿 스토어',
    template: '%s — pixelkits',   // ← 하위 페이지: "템플릿 목록 — pixelkits"
  },
  description: '개발자가 만든 프리미엄 Next.js 템플릿. 바로 쓸 수 있는 코드로 납품 속도를 3배 높이세요.',
  keywords: ['Next.js 템플릿', '프론트엔드 템플릿', '리액트 템플릿', '웹 템플릿', 'UI 템플릿', 'pixelkits'],
  authors: [{ name: 'pixelkits', url: BASE_URL }],
  creator: 'pixelkits',
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'ko_KR',
    url:         BASE_URL,
    siteName:    'pixelkits',
    title:       'pixelkits — 프론트엔드 템플릿 스토어',
    description: '개발자가 만든 프리미엄 Next.js 템플릿. 바로 쓸 수 있는 코드로 납품 속도를 3배 높이세요.',
    images: [{
      url:    '/og-default.png',  // public/og-default.png (1200×630)
      width:  1200,
      height: 630,
      alt:    'pixelkits 프론트엔드 템플릿 스토어',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'pixelkits — 프론트엔드 템플릿 스토어',
    description: '개발자가 만든 프리미엄 Next.js 템플릿.',
    images:      ['/og-default.png'],
  },
  icons: {
    icon:       '/favicon.ico',
    shortcut:   '/favicon-16x16.png',
    apple:      '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${syne.variable} ${dm.variable}`}>
      <body className="bg-ink text-sand font-dm antialiased">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}