import type { AdminUserAdmin } from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side read of the admin-accounts API (`GET /api/v1/admin/users`). Needs `manage:admins`. */
export async function getAdminUsers(): Promise<AdminReadResult<AdminUserAdmin[]>> {
  const result = await forwardedRead<{ users: AdminUserAdmin[] }>('/api/v1/admin/users');
  return result.ok ? { ok: true, data: result.data.users } : result;
}
