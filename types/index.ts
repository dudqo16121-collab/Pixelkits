// ─── 템플릿 ────────────────────────────────────────────
export type TemplateCategory =
  | 'landing'
  | 'saas'
  | 'portfolio'
  | 'ecom'
  | 'dashboard'
  | 'blog'

export type TemplateStack = 'nextjs' | 'react' | 'vue' | 'html' | 'astro'

export interface Template {
  id: string
  slug: string                   // URL용 식별자 (예: "lumina-saas-kit")
  name: string
  description: string
  category: TemplateCategory
  stack: TemplateStack[]
  price: number                  // 원화 (0이면 무료)
  original_price: number         // 원래 가격 (할인 표시용)
  thumbnail_url: string
  preview_url: string            // 라이브 미리보기 URL
  download_url?: string          // Supabase Storage URL (비공개)
  file_size_kb: number
  badge?: 'new' | 'hot' | 'free' | 'sale'
  rating: number
  download_count: number
  review_count:   number
  features: string[]             // 포함 기능 목록
  sections: string[]             // 섹션 구성 목록
  is_published: boolean   // ← 이 줄 추가
  created_at: string
  updated_at: string
}

// ─── 주문 ────────────────────────────────────────────
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export interface Order {
  id: string
  order_number: string           // PKT-YYYYMMDD-XXXX
  user_email: string
  template_id: string
  template: Template             // JOIN
  amount: number                 // 실제 결제 금액
  original_amount: number
  discount_amount: number
  payment_method: 'card' | 'tosspay' | 'kakaopay'
  payment_key?: string           // 토스페이먼츠 결제 키
  status: OrderStatus
  download_token: string         // 1회용 다운로드 토큰
  token_expires_at: string       // 토큰 만료 시각
  created_at: string
}

// ─── 결제 ────────────────────────────────────────────
export interface CheckoutPayload {
  templateId: string
  email: string
  promoCode?: string
  paymentMethod: 'card' | 'tosspay' | 'kakaopay'
}

export interface PromoCode {
  code: string
  discount_percent: number
  expires_at: string
  max_uses: number
  used_count: number
}

// ─── API 응답 ────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}
