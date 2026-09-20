import { ENQUIRY_STATUS, ENQUIRY_STATUSES } from '@nexastack/shared';
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * Read + admin-update mirror of `apps/web/lib/models/ContactSubmission.ts` — that file remains
 * the canonical, write-owning schema for CREATING a submission (the public `/contact` form
 * persists through apps/web's own Route Handler, not through this API). Both apps point at the
 * same MongoDB database and the same model name, so this resolves to the identical
 * `contactsubmissions` collection. Keep the two schemas in step.
 *
 * Enquiry workflow (Enquiry Management task):
 * - `status` is the 4-state reply workflow (`ENQUIRY_STATUSES`). Legacy rows may still hold the
 *   old value `responded` until `scripts/migrate-enquiry-status.ts` has run; every read in
 *   `adminEnquiries.service.ts` tolerates that.
 * - `archived` is an orthogonal flag, not a fifth status. Legacy rows may lack the field, so
 *   queries treat "missing" as not archived (`archived: { $ne: true }`).
 * - `notes` are internal, append-only admin commentary. Never shown to the sender.
 */
const noteSchema = new Schema({
  authorAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, required: true, default: Date.now },
});

const contactSubmissionSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    companyName: { type: String, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    preferredContactMethod: {
      type: String,
      required: true,
      enum: ['email', 'phone', 'whatsapp'],
    },
    consent: { type: Boolean, required: true },
    status: {
      type: String,
      required: true,
      enum: ENQUIRY_STATUSES,
      default: ENQUIRY_STATUS.NEW,
    },
    archived: { type: Boolean, required: true, default: false },
    archivedAt: { type: Date, default: null },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The admin list is "active = archived $ne true, newest first". `$ne` matches two ranges of the
// compound index below, so Mongo cannot read it in `createdAt` order; the standalone `createdAt`
// index is what serves that sort. It must be declared here too, exactly as in the web mirror, so the
// collection has the same indexes whichever app connects first.
contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ archived: 1, status: 1, createdAt: -1 });

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const ContactSubmission =
  (models.ContactSubmission as Model<ContactSubmissionDocument> | undefined) ??
  model<ContactSubmissionDocument>('ContactSubmission', contactSubmissionSchema);
