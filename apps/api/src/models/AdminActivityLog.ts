import { ADMIN_EVENT_TYPES, type AdminEventType } from '@nexastack/shared';
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * Audit trail for admin auth events (root CLAUDE.md 11.3's "audit log" requirement), and the
 * data source for `/admin/activity`. `adminUserId` is nullable: a failed login before identity
 * is confirmed (wrong email, or a genuine mismatch) still needs to be logged, but there's no
 * real user to reference — `attemptedEmail` carries that case instead, and is never used to
 * imply that email belongs to a real account (see `auth.service.ts`'s generic-error handling).
 *
 * The list of events lives in `@nexastack/shared` (`ADMIN_EVENT_TYPES`), so the audit view's filter and
 * its labels in the web app are built from the same list this model validates against.
 */
const adminActivityLogSchema = new Schema(
  {
    adminUserId: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    attemptedEmail: { type: String, trim: true, lowercase: true },
    eventType: { type: String, required: true, enum: ADMIN_EVENT_TYPES },
    ipAddress: { type: String },
    userAgent: { type: String },
    // Structured, extensible — deliberately untyped beyond "an object" so a future admin
    // action (content publish, media delete, etc.) can log its own shape without a schema
    // migration here. Never put a secret in it (enforced by convention, not validation — see
    // adminActivityLog.service.ts, the only writer).
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ adminUserId: 1, createdAt: -1 });

export type AdminActivityLogDocument = InferSchemaType<typeof adminActivityLogSchema>;
export type AdminActivityEventType = AdminEventType;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const AdminActivityLog =
  (models.AdminActivityLog as Model<AdminActivityLogDocument> | undefined) ??
  model<AdminActivityLogDocument>('AdminActivityLog', adminActivityLogSchema);
