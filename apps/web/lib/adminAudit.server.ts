import type { AdminAuditEntry, Paginated } from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side read of the audit view's API (`GET /api/v1/auth/activity`). Needs `audit:view`. */

export interface AuditListParams {
  /** Already validated against the event types by the caller. */
  event?: string | undefined;
  /** `YYYY-MM-DD`, a day in Asia/Dhaka, inclusive. Already validated by the caller. */
  from?: string | undefined;
  to?: string | undefined;
  page?: number | undefined;
}

export const AUDIT_PAGE_SIZE = 25;

function auditQueryString(params: AuditListParams): string {
  const search = new URLSearchParams({ limit: String(AUDIT_PAGE_SIZE) });
  if (params.event) search.set('event', params.event);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  return `?${search.toString()}`;
}

export async function getAuditLog(
  params: AuditListParams,
): Promise<AdminReadResult<Paginated<AdminAuditEntry>>> {
  return forwardedRead(`/api/v1/auth/activity${auditQueryString(params)}`);
}
