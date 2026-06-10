/** @type {import('next').NextConfig} */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelkits.co'

// ── Content Security Policy ───────────────────────────
const CSP = [
  // 기본 정책
  `default-src 'self'`,

  // 스크립트 — Toss SDK + Next.js 인라인 스크립트
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com`,

  // 스타일 — 인라인 스타일 허용 (Tailwind)
  `style-src 'self' 'unsafe-inline'`,

  // 이미지 — Supabase Storage + 외부 OG 이미지
  `img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in`,

  // 폰트
  `font-src 'self' data:`,

  // API 연결 허용 — Supabase, Toss
  `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.tosspayments.com https://js.tosspayments.com`,

  // iframe — Toss 결제창, 라이브 미리보기
  `frame-src 'self' https://js.tosspayments.com https://auth.tosspayments.com`,

  // 미디어
  `media-src 'self'`,

  // 폼 제출
  `form-action 'self'`,

  // 베이스 URI
  `base-uri 'self'`,

  // HTTPS 강제 (운영환경만)
  ...(process.env.NODE_ENV === 'production' ? [`upgrade-insecure-requests`] : []),
].join('; ')

// ── 보안 헤더 ─────────────────────────────────────────
const SECURITY_HEADERS = [
  // XSS 방어
  {
    key:   'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 클릭재킹 방어
  {
    key:   'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // 레거시 XSS 필터
  {
    key:   'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Referrer 정책
  {
    key:   'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // HTTPS 강제 (운영환경 1년)
  {
    key:   'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // 브라우저 기능 제한
  {
    key:   'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self "https://js.tosspayments.com")',
    ].join(', '),
  },
  // CSP
  {
    key:   'Content-Security-Policy',
    value: CSP,
  },
]

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co'  },
      { protocol: 'https', hostname: '*.supabase.in'  },
    ],
  },

  // ── 보안 헤더 적용 ───────────────────────────────────
  async headers() {
    return [
      {
        // 모든 라우트에 적용
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // API Route — CORS 헤더 추가
        source: '/api/(.*)',
        headers: [
          {
            key:   'Access-Control-Allow-Origin',
            value: SITE_URL,
          },
          {
            key:   'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key:   'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        // 정적 자산 — 캐시 최적화
        source: '/(_next/static|favicon|icons)(.*)',
        headers: [
          {
            key:   'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ── 리다이렉트 ──────────────────────────────────────
  async redirects() {
    return [
      // www → non-www
      {
        source:      '/:path*',
        has:         [{ type: 'host', value: 'www.pixelkits.co' }],
        destination: `${SITE_URL}/:path*`,
        permanent:   true,
      },
    ]
  },
}

module.exports = nextConfig