/**
 * Minimal per-IP fixed-window rate limiter for `/api/contact`. Mirrors the policy and caveats
 * of `apps/api/src/middleware/rateLimit.ts` (10 requests / 15 min) rather than adding
 * `express-rate-limit` as a dependency here — Route Handlers don't have Express's req/res shape.
 *
 * The store is an in-memory Map: per-process, reset on restart, and only correct on a single
 * warm serverless instance. Acceptable as a coarse backstop for now; move to a shared store
 * (e.g. Redis / Vercel KV) before relying on it as the sole defence at scale.
 */

const WINDOW_MS = 15 * 60 * 1000;
export const CONTACT_RATE_LIMIT = 10;

interface WindowEntry {
  count: number;
  resetAt: number;
}

const hits = new Map<string, WindowEntry>();

/** Clears expired entries so the map doesn't grow without bound over a long-lived instance. */
function sweep(now: number): void {
  for (const [ip, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(ip);
  }
}

export function checkContactRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= CONTACT_RATE_LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from headers a proxy (Vercel, etc.) sets. Falls back to a fixed key. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
