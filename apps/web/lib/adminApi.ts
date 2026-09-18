import { env } from '@/lib/env';

/**
 * Matches the header apps/api's `middleware/csrf.ts` requires on every mutating auth request —
 * a cross-site `<form>` submission can't set a custom header, so this (plus the browser's own
 * `Origin` header, checked server-side) is real CSRF protection, not decoration.
 */
const CSRF_HEADER_NAME = 'X-Requested-With';
const CSRF_HEADER_VALUE = 'nexastack-admin';

/**
 * Client-side fetch to the Express API (root CLAUDE.md 22.5 reserves it for the admin
 * interface). `credentials: 'include'` is required for the session cookie to be sent/received
 * across the web/api origins in dev (:3000 / :4000).
 */
export async function adminApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      ...init.headers,
    },
  });
}
