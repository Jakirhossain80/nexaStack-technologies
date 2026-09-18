import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * Read + status-update mirror of `apps/web/lib/models/ContactSubmission.ts` — that file
 * remains the canonical, write-owning schema (the public `/contact` form persists through
 * apps/web's own Route Handler, not through this API). Both apps point at the same MongoDB
 * database (see apps/web/.env.example and apps/api/.env.example) and the same model name,
 * so this resolves to the identical `contactsubmissions` collection.
 *
 * `status` gets a real enum here (and in the canonical schema) now that this admin
 * interface exists to transition it — previously left open by design.
 */
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
    status: { type: String, required: true, enum: ['new', 'responded'], default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const ContactSubmission =
  (models.ContactSubmission as Model<ContactSubmissionDocument> | undefined) ??
  model<ContactSubmissionDocument>('ContactSubmission', contactSubmissionSchema);
