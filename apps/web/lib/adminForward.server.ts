import type { ApiResponse } from '@nexastack/shared';
import { headers } from 'next/headers';

import { env } from '@/lib/env';

/**
 * Server-side read of the Express admin API, for admin pages. A Server Component can read the
 * incoming request's cookies via `next/headers`, but a server-to-server `fetch()` does not attach
 * them, so the `Cookie` header is forwarded explicitly.
 *
 * The result distinguishes a genuine 404 (render `notFound()`) from "the API is down" (503-ish) or
 * "your role cannot see this" (403), which `adminDashboard.server.ts`'s null-on-anything helper
 * cannot express. Shared by every admin content area (blog, enquiries).
 */

export type AdminReadResult<T> =
  { ok: true; data: T } | { ok: false; status: number | null; message: string };

export async function forwardedRead<T>(path: string): Promise<AdminReadResult<T>> {
  const incoming = await headers();
  const cookie = incoming.get('cookie');
  if (!cookie) return { ok: false, status: 401, message: 'You are not signed in.' };

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const body = (await response.json()) as ApiResponse<T>;
    if (body.success) return { ok: true, data: body.data };
    return { ok: false, status: response.status, message: body.error.message };
  } catch {
    return {
      ok: false,
      status: null,
      message: 'The admin API could not be reached. Check that it is running and try again.',
    };
  }
}
