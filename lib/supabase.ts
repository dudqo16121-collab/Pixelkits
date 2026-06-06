import { createClient } from '@supabase/supabase-js'

// 클라이언트 + 서버 둘 다 사용 가능
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)