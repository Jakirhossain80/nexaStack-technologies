/**
 * Minimal per-IP fixed-window rate limiter for `/api/quotation` and `/api/quotation/upload`.
 * Same policy shape as `lib/rateLimit.ts` (used by `/api/contact`), kept as a separate module
 * with its own store rather than editing that file, so contact's rate limiting is untouched.
 *
 * The store is an in-memory Map: per-process, reset on restart, and only correct on a single
 * warm serverless instance. Acceptable as a coarse backstop for now; move to a shared store
 * (e.g. Redis / Vercel KV) before relying on it as the sole defence at scale.
 */

const WINDOW_MS = 15 * 60 * 1000;
export const QUOTATION_RATE_LIMIT = 10;
export const QUOTATION_UPLOAD_RATE_LIMIT = 20;

interface WindowEntry {
  count: number;
  resetAt: number;
}

function sweep(store: Map<string, WindowEntry>, now: number): void {
  for (const [ip, entry] of store) {
    if (entry.resetAt <= now) store.delete(ip);
  }
}

function createLimiter(limit: number) {
  const hits = new Map<string, WindowEntry>();

  return function check(ip: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    sweep(hits, now);

    const entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (entry.count >= limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export const checkQuotationRateLimit = createLimiter(QUOTATION_RATE_LIMIT);
export const checkQuotationUploadRateLimit = createLimiter(QUOTATION_UPLOAD_RATE_LIMIT);

/** Best-effort client IP from headers a proxy (Vercel, etc.) sets. Falls back to a fixed key. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
