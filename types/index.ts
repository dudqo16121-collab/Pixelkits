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
  id:             string
  slug:           string
  name:           string
  description:    string
  category:       TemplateCategory
  stack:          TemplateStack[]
  price:          number
  original_price: number
  thumbnail_url:  string
  preview_url:    string
  download_url?:  string
  file_size_kb:   number
  badge?:         'new' | 'hot' | 'free' | 'sale'
  rating:         number
  download_count: number
  review_count:   number
  features:       string[]
  sections:       string[]
  is_published:   boolean
  created_at:     string
  updated_at:     string
}

// ─── 주문 ────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'completed'
  | 'partial_refund'   // ← 추가
  | 'refunded'
  | 'failed'

export interface Order {
  id:                 string
  order_number:       string
  user_id?:           string
  user_email:         string
  template_id:        string
  template?:          Template
  amount:             number
  original_amount:    number
  discount_amount:    number
  refunded_amount:    number      // ← 추가
  promo_code?:        string
  payment_method:     'card' | 'tosspay' | 'kakaopay' | 'free'
  payment_key?:       string
  toss_order_id?:     string
  status:             OrderStatus
  download_token:     string
  token_expires_at:   string
  download_count:     number      // ← 추가
  max_download_count: number      // ← 추가
  refund_reason?:     string
  refunded_at?:       string
  created_at:         string
  updated_at?:        string
}

// ─── 결제 ────────────────────────────────────────────
export interface CheckoutPayload {
  templateId:    string
  email:         string
  promoCode?:    string
  paymentMethod: 'card' | 'tosspay' | 'kakaopay'
}

// ─── 프로모 코드 ──────────────────────────────────────
export interface PromoCode {
  id:               string
  code:             string
  discount_percent: number
  expires_at?:      string
  max_uses?:        number
  used_count:       number
  is_active:        boolean
  created_at:       string
}

// ─── 후기 ────────────────────────────────────────────
export interface Review {
  id:          string
  user_id:     string
  template_id: string
  order_id?:   string
  rating:      number
  content:     string
  created_at:  string
  profiles?:   { name: string | null }
}

// ─── API 응답 ────────────────────────────────────────
export interface ApiResponse<T> {
  data?:  T
  error?: string
}