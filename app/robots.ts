import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/admin',         // 관리자 페이지
          '/api/',          // API 라우트
          '/checkout/',     // 결제 페이지
          '/orders',        // 개인 구매 내역
          '/downloads',     // 개인 다운로드
          '/settings',      // 계정 설정
          '/wishlist',      // 찜 목록
        ],
      },
    ],
    sitemap: 'https://pixelkits.co/sitemap.xml',
  }
}