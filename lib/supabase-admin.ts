import { createClient } from '@supabase/supabase-js'

// 서버(API Route)에서만 import 해야 해요
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)