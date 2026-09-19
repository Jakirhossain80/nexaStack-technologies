import type { ApiResponse, AuthenticatedAdmin, Permission } from '@nexastack/shared';
import { headers } from 'next/headers';
import { cache } from 'react';

import { env } from '@/lib/env';

export type { AuthenticatedAdmin };

/**
 * Forwards the browser's `Cookie` header to apps/api's `GET /api/v1/auth/session` explicitly —
 * a Server Component can read the incoming request's cookies via `next/headers`, but a
 * server-to-server `fetch()` does not automatically attach them. Deliberately not a local JWT
 * decode: the API stays the single source of truth for whether a session is still valid
 * (signature, expiry, *and* not revoked in MongoDB, *and* the account not suspended) — see the Admin
 * Authentication task's cross-origin architecture notes. Returns `null` for "not authenticated",
 * never throws.
 *
 * The result carries the admin's `permissions` (computed by the API from the one role-to-capability
 * map) and `mustChangePassword`. Wrapped in React `cache()` so the layout, the page and any component
 * that asks during ONE request share a single lookup instead of each calling the API.
 */
export const getAdminSession = cache(async (): Promise<AuthenticatedAdmin | null> => {
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
});

/**
 * Whether the signed-in admin holds a capability, for deciding what to SHOW. This is user-experience
 * only (root CLAUDE.md 11.3: hiding a button is not authorisation): every action is checked again by
 * the API on the endpoint itself, whatever this returns.
 */
export function can(
  admin: Pick<AuthenticatedAdmin, 'permissions'> | null | undefined,
  permission: Permission,
): boolean {
  return admin ? admin.permissions.includes(permission) : false;
}

/** One line of the dashboard's recent-activity feed. */
export interface AdminActivityEntry {
  id: string;
  eventType: string;
  attemptedEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
