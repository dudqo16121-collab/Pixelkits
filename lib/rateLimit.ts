// 메모리 기반 슬라이딩 윈도우 Rate Limiter
// Vercel 같은 서버리스 환경: 인스턴스 per 프로세스 기준

interface RateLimitEntry {
  count:     number
  resetAt:   number
}

const store = new Map<string, RateLimitEntry>()

// 오래된 항목 주기적 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key)
  }
}, 60_000)

export interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    number
}

/**
 * @param key      식별자 (IP, userId 등)
 * @param limit    허용 횟수
 * @param windowMs 윈도우 시간 (ms)
 */
export function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number
): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // 새 윈도우 시작
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// IP 추출 헬퍼
export function getIP(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for')
    ?? (req.headers as any)['x-forwarded-for']
  if (forwarded) return (forwarded as string).split(',')[0].trim()
  return 'unknown'
}