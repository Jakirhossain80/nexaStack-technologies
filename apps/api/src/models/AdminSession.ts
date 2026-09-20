import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * Server-side session record backing the JWT's embedded `sessionId` — the real, checkable
 * "logout invalidates" property root CLAUDE.md 11.3 asks for. A stateless JWT alone can't be
 * revoked before its natural expiry; this collection is what makes revocation real. Checked on
 * every authenticated request by `middleware/requireSession.ts` — a session is only valid if it
 * exists here, isn't revoked, and hasn't expired, regardless of what the JWT itself claims.
 */
const adminSessionSchema = new Schema(
  {
    adminUserId: { type: Schema.Types.ObjectId, required: true, ref: 'AdminUser' },
    sessionId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// No separate `.index({ sessionId: 1 })` here — `unique: true` on the field above already
// creates that index; declaring both produces a duplicate-index warning at startup.
// TTL index: MongoDB automatically removes expired session documents so this collection
// doesn't grow unbounded — a housekeeping convenience, not the actual security check (that's
// the explicit expiresAt/revokedAt comparison in requireSession.ts, which doesn't rely on
// TTL's background-sweep timing).
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// "Revoke every live session of this admin" (suspend, password reset, password change) matches on
// `adminUserId` + `revokedAt: null`. Small collection, but it is a security path, so keep it indexed.
adminSessionSchema.index({ adminUserId: 1, revokedAt: 1 });

export type AdminSessionDocument = InferSchemaType<typeof adminSessionSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const AdminSession =
  (models.AdminSession as Model<AdminSessionDocument> | undefined) ??
  model<AdminSessionDocument>('AdminSession', adminSessionSchema);
