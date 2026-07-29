type Bucket = { count: number; resetAt: number; lastFingerprint: string | null; lastAt: number }
const buckets = new Map<string, Bucket>()

export function checkRateLimit(userId: string, fingerprint: string, now = Date.now()) {
  const limit = Number(process.env.ASSISTANT_RATE_LIMIT_PER_HOUR ?? 30)
  const bucket = buckets.get(userId)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + 3_600_000, lastFingerprint: fingerprint, lastAt: now })
    return { allowed: true, remaining: Math.max(limit - 1, 0), retryAfter: 0 }
  }
  if (bucket.lastFingerprint === fingerprint && now - bucket.lastAt < 2_000) {
    return { allowed: false, remaining: Math.max(limit - bucket.count, 0), retryAfter: 2 }
  }
  if (bucket.count >= limit) return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  bucket.count += 1; bucket.lastFingerprint = fingerprint; bucket.lastAt = now
  return { allowed: true, remaining: Math.max(limit - bucket.count, 0), retryAfter: 0 }
}

export function resetRateLimitsForTests() { buckets.clear() }
