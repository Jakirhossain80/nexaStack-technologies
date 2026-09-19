import type { Types } from 'mongoose';

import { logger } from '../lib/logger.js';
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

/** Who did something and from where. Built by a controller from `req.admin` and the request;
 * services take it as a plain value and never touch `req`/`res`. */
export interface AdminActionContext {
  adminId: string;
  ipAddress: string;
  userAgent: string | undefined;
}

/**
 * Audit an admin content action (root CLAUDE.md 17, apps/api/CLAUDE.md 5). Call it AFTER the
 * change has been saved. A failure to write the audit entry is logged loudly but does not fail
 * the request: the change is already durable, and reporting an error for it would tell the
 * admin the save failed when it did not.
 */
export async function logAdminAction(
  context: AdminActionContext,
  eventType: AdminActivityEventType,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await logAdminActivity({
      adminUserId: context.adminId,
      eventType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata,
    });
  } catch (err) {
    logger.error({ err, eventType, adminId: context.adminId }, 'Failed to write admin audit entry');
  }
}

/** Default page size for the full `/admin/activity` page. The dashboard's compact feed
 * passes a smaller explicit limit instead (see routes/admin.routes.ts). */
const RECENT_ACTIVITY_LIMIT = 100;

export interface RecentActivityEntry {
  id: string;
  eventType: AdminActivityEventType;
  attemptedEmail: string | undefined;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  createdAt: Date;
}

/** Read-only, for `/admin/activity` and the dashboard's compact activity feed. `.lean()`
 * since this is display-only, per root CLAUDE.md 11.5. */
export async function listRecentAdminActivity(
  limit: number = RECENT_ACTIVITY_LIMIT,
): Promise<RecentActivityEntry[]> {
  const entries = await AdminActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();

  return entries.map((entry) => ({
    id: entry._id.toString(),
    eventType: entry.eventType as AdminActivityEventType,
    attemptedEmail: entry.attemptedEmail ?? undefined,
    ipAddress: entry.ipAddress ?? undefined,
    userAgent: entry.userAgent ?? undefined,
    createdAt: entry.createdAt as Date,
  }));
}
