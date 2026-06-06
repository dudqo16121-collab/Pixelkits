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

export const metadata: Metadata = {
  title: 'pixelkits — 프론트엔드 템플릿 스토어',
  description: '개발자가 만든 프리미엄 Next.js 템플릿. 바로 쓸 수 있는 코드.',
  openGraph: {
    title: 'pixelkits',
    description: '프리미엄 프론트엔드 템플릿 스토어',
    url: 'https://pixelkits.co',
    siteName: 'pixelkits',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
