import type { ApiResponse, Role } from '@nexastack/shared';
import { headers } from 'next/headers';

import { env } from '@/lib/env';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: Role;
}

/**
 * Forwards the browser's `Cookie` header to apps/api's `GET /api/v1/auth/session` explicitly —
 * a Server Component can read the incoming request's cookies via `next/headers`, but a
 * server-to-server `fetch()` does not automatically attach them. Deliberately not a local JWT
 * decode: the API stays the single source of truth for whether a session is still valid
 * (signature, expiry, *and* not revoked in MongoDB) — see the Admin Authentication task's
 * cross-origin architecture notes. Returns `null` for "not authenticated", never throws.
 */
export async function getAdminSession(): Promise<AuthenticatedAdmin | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get('cookie');
  if (!cookie) return null;

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/session`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const body = (await response.json()) as ApiResponse<{ admin: AuthenticatedAdmin }>;
    return body.success ? body.data.admin : null;
  } catch {
    return null;
  }
}

export interface AdminActivityEntry {
  id: string;
  eventType: string;
  attemptedEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/** Same forwarded-cookie pattern as `getAdminSession` — used by `/admin/activity`. Returns an
 * empty list rather than throwing if the request fails, since this is a read-only display. */
export async function getRecentAdminActivity(): Promise<AdminActivityEntry[]> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get('cookie');
  if (!cookie) return [];

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/activity`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return [];

    const body = (await response.json()) as ApiResponse<{ entries: AdminActivityEntry[] }>;
    return body.success ? body.data.entries : [];
  } catch {
    return [];
  }
}
