import { ADMIN_STATUS, ADMIN_STATUSES, ROLES } from '@nexastack/shared';
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// Named imports (`{ Schema, model, models }`) from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project (unlike apps/web, where Next.js's bundler
// mediates it) — apps/api's existing lib/db.ts already only uses the default import for
// exactly this reason. Destructuring from the default export avoids the CJS/ESM interop gap.
const { Schema, model, models } = mongoose;

/**
 * An admin account. The first one is created by `scripts/seed-admin.ts`; every later one only by a
 * `super_admin` (`POST /api/v1/admin/users`). There is no public registration.
 *
 * `passwordHash` is `select: false` (root CLAUDE.md 11.5) — every query must opt in with
 * `.select('+passwordHash')` to read it, so an accidental `find()` elsewhere can never leak it.
 *
 * `status` and `mustChangePassword` were added by the Admin Roles task. Accounts created before that
 * have neither field: a MISSING `status` means active and a missing `mustChangePassword` means false
 * (Mongoose applies those defaults on read, and queries use `status: { $ne: 'suspended' }` rather than
 * `status: 'active'`). `scripts/migrate-admin-users.ts` writes them explicitly.
 */
const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    // A suspended account cannot sign in, and every session it has is revoked when it is suspended.
    status: { type: String, required: true, enum: ADMIN_STATUSES, default: ADMIN_STATUS.ACTIVE },
    // True while the account still has the temporary password a super_admin gave it: the API refuses
    // everything except changing the password (and signing out) until it is changed.
    mustChangePassword: { type: Boolean, required: true, default: false },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;

// Explicit `Model<AdminUserDocument>` on both sides of `??`: without it, `models.AdminUser`'s
// loose global-registry type wins the union and collapses query filters (`.findOne({ email })`)
// to `never`, even though this is otherwise the same "reuse across hot reloads" pattern used
// elsewhere in this codebase (e.g. apps/web's ContactSubmission model) — that model just never
// happened to call `.findOne()` with a field filter, so the same latent issue never surfaced.
export const AdminUser =
  (models.AdminUser as Model<AdminUserDocument> | undefined) ?? model<AdminUserDocument>('AdminUser', adminUserSchema);
