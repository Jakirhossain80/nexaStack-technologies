import type { Types } from 'mongoose';

import { AdminActivityLog, type AdminActivityEventType } from '../models/AdminActivityLog.js';

export interface LogAdminActivityInput {
  adminUserId?: Types.ObjectId | string | null;
  attemptedEmail?: string;
  eventType: AdminActivityEventType;
  ipAddress: string;
  userAgent: string | undefined;
  metadata?: Record<string, unknown>;
}

/**
 * The only writer of AdminActivityLog. Never pass a password, token, or any other secret in
 * `metadata` — this is a durable audit trail, not a debug log, and nothing here is redacted the
 * way `lib/logger.ts`'s Pino output is.
 */
export async function logAdminActivity(input: LogAdminActivityInput): Promise<void> {
  await AdminActivityLog.create({
    adminUserId: input.adminUserId ?? null,
    attemptedEmail: input.attemptedEmail,
    eventType: input.eventType,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: input.metadata,
  });
}

const RECENT_ACTIVITY_LIMIT = 100;

export interface RecentActivityEntry {
  id: string;
  eventType: AdminActivityEventType;
  attemptedEmail: string | undefined;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  createdAt: Date;
}

/** Read-only, for `/admin/activity` — the founder's own visibility into login/activity
 * history. `.lean()` since this is display-only, per root CLAUDE.md 11.5. */
export async function listRecentAdminActivity(): Promise<RecentActivityEntry[]> {
  const entries = await AdminActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(RECENT_ACTIVITY_LIMIT)
    .lean();

  return entries.map((entry) => ({
    id: entry._id.toString(),
    eventType: entry.eventType as AdminActivityEventType,
    attemptedEmail: entry.attemptedEmail ?? undefined,
    ipAddress: entry.ipAddress ?? undefined,
    userAgent: entry.userAgent ?? undefined,
    createdAt: entry.createdAt as Date,
  }));
}
