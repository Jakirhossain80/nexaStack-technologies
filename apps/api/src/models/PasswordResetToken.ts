import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * A password-reset request (Fork 1, option A — the confirmed self-service flow). Only a hash of
 * the token is stored, never the raw value (same reasoning as `AdminUser.passwordHash`) — the
 * raw token exists only in the link sent to the admin (currently logged server-side, per the
 * deferred-email hook in `lib/mailer.ts`, since no transactional email provider is chosen yet —
 * root CLAUDE.md 22 item 4).
 */
const passwordResetTokenSchema = new Schema(
  {
    adminUserId: { type: Schema.Types.ObjectId, required: true, ref: 'AdminUser' },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// No separate `.index({ tokenHash: 1 })` here — `unique: true` on the field above already
// creates that index; declaring both produces a duplicate-index warning at startup.
// TTL housekeeping, same reasoning as AdminSession's — not the actual expiry check (that's the
// explicit expiresAt/usedAt comparison in the service layer).
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const PasswordResetToken =
  (models.PasswordResetToken as Model<PasswordResetTokenDocument> | undefined) ??
  model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
