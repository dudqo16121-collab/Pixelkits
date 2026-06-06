# pixelkits — 프론트엔드 템플릿 스토어

> Next.js 14 + Tailwind CSS + Supabase 기반 디지털 상품 판매 사이트

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.local .env.local
# → .env.local 열고 Supabase, 토스페이먼츠 키 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000 에서 확인
```

## 폴더 구조

```
pixelkits/
├── app/
│   ├── (store)/          # 스토어 페이지 그룹 (Navbar+Footer 포함)
│   │   ├── page.tsx           # 홈
│   │   ├── templates/         # 템플릿 목록
│   │   │   └── [slug]/        # 템플릿 상세
│   │   ├── checkout/          # 결제
│   │   │   └── success/       # 결제 완료 + 다운로드
│   │   ├── orders/            # 구매 내역
│   │   ├── faq/               # FAQ
│   │   └── about/             # 소개
│   ├── api/
│   │   └── webhook/           # 토스페이먼츠 웹훅
│   ├── layout.tsx             # 루트 레이아웃 (폰트)
│   └── globals.css            # 전역 스타일
├── components/
│   ├── layout/                # Navbar, Footer, StoreLayout
│   └── ui/                    # TemplateCard, Badge 등
├── lib/
│   ├── supabase.ts            # Supabase 클라이언트
│   ├── utils.ts               # 유틸리티 함수
│   └── templates.ts           # 목 데이터 (개발용)
├── types/
│   └── index.ts               # TypeScript 타입 정의
└── .env.local                 # 환경 변수 (Git 제외)
```

## 페이지별 URL

| 페이지 | URL |
|---|---|
| 홈 | `/` |
| 템플릿 목록 | `/templates` |
| 템플릿 상세 | `/templates/[slug]` |
| 결제 | `/checkout?template=[slug]` |
| 결제 완료 | `/checkout/success` |
| 구매 내역 | `/orders` |
| FAQ | `/faq` |
| 소개 | `/about` |

## 다음 단계

1. **Supabase 설정** — 테이블 생성 (templates, orders, promo_codes)
2. **토스페이먼츠 연동** — SDK 설치 및 webhook 구현
3. **Supabase Storage** — 파일 업로드 및 다운로드 토큰 구현
4. **Vercel 배포** — GitHub 연결 후 원클릭 배포
