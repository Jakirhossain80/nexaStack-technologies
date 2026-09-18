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
 */
const EVENT_TYPES = [
  'login_success',
  'login_failure',
  'logout',
  'password_reset_requested',
  'password_reset_completed',
] as const;

const adminActivityLogSchema = new Schema(
  {
    adminUserId: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    attemptedEmail: { type: String, trim: true, lowercase: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES },
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
export type AdminActivityEventType = (typeof EVENT_TYPES)[number];

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const AdminActivityLog =
  (models.AdminActivityLog as Model<AdminActivityLogDocument> | undefined) ??
  model<AdminActivityLogDocument>('AdminActivityLog', adminActivityLogSchema);
