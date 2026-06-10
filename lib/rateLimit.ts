// ── Upstash Redis Rate Limiter (분산 환경 대응)
// UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 없으면 메모리 fallback

let redisRateLimiter: any = null

// Upstash 환경변수 있을 때만 Redis 사용
async function getRedisLimiter(limit: number, windowMs: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis }     = await import('@upstash/redis')

    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.floor(windowMs / 1000)} s`),
    })
  } catch {
    return null
  }
}

// ── 메모리 fallback ───────────────────────────────────
interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of memStore) {
    if (v.resetAt < now) memStore.delete(k)
  }
}, 60_000)

function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now   = Date.now()
  const entry = memStore.get(key)
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ── 공개 인터페이스 ───────────────────────────────────
export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

export async function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): Promise<RateLimitResult> {
  // Redis 시도
  const limiter = await getRedisLimiter(limit, windowMs)
  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(key)
      return {
        allowed:   success,
        remaining: remaining ?? 0,
        resetAt:   reset ? Number(reset) : Date.now() + windowMs,
      }
    } catch {
      // Redis 오류 시 메모리 fallback
    }
  }
  // 메모리 fallback
  return memRateLimit(key, limit, windowMs)
}

// ── IP 추출 헬퍼 ─────────────────────────────────────
export function getIP(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for')
    ?? (req.headers as any)['x-forwarded-for']
  if (forwarded) return (forwarded as string).split(',')[0].trim()
  return 'unknown'
}