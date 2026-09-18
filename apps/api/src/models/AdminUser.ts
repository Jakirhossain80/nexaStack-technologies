import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// Named imports (`{ Schema, model, models }`) from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project (unlike apps/web, where Next.js's bundler
// mediates it) — apps/api's existing lib/db.ts already only uses the default import for
// exactly this reason. Destructuring from the default export avoids the CJS/ESM interop gap.
const { Schema, model, models } = mongoose;

/**
 * The single admin account (root CLAUDE.md 22.2 — phase 2, not yet built out beyond auth).
 * Created only by `scripts/seed-admin.ts`, never through a public registration form.
 *
 * `passwordHash` is `select: false` (root CLAUDE.md 11.5) — every query must opt in with
 * `.select('+passwordHash')` to read it, so an accidental `find()` elsewhere can never leak it.
 */
const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ['super_admin', 'admin', 'content_editor'] },
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
