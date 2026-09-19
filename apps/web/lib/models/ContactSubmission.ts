import { ENQUIRY_STATUS, ENQUIRY_STATUSES } from '@nexastack/shared';
import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A validated `/contact` page submission. Fields mirror `contactFormSchema` from
 * `@nexastack/shared` exactly — Zod is the security boundary (validated before this document
 * is constructed); these constraints are the second layer required by root CLAUDE.md 11.5.
 *
 * This is the canonical schema for CREATING a submission. `apps/api/src/models/ContactSubmission.ts`
 * mirrors it for the admin Enquiry Management endpoints; keep the two in step.
 */
const noteSchema = new Schema({
  authorAdminId: { type: Schema.Types.ObjectId, required: true },
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
    // The 4-state reply workflow (`new -> read -> contacted -> closed`, see
    // packages/shared/src/constants/enquiryStatus.ts). A submission is always created `new`; the
    // admin interface (apps/api) moves it on. Old rows may still say `responded` until
    // apps/api/scripts/migrate-enquiry-status.ts has run.
    status: { type: String, required: true, enum: ENQUIRY_STATUSES, default: ENQUIRY_STATUS.NEW },
    // Orthogonal to status: an enquiry can be archived from any status.
    archived: { type: Boolean, required: true, default: false },
    archivedAt: { type: Date, default: null },
    // Internal, append-only admin notes. Written only by apps/api; never by the public form.
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ archived: 1, status: 1, createdAt: -1 });

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>;

// `models.ContactSubmission` is reused across hot reloads in development so Mongoose doesn't
// throw "Cannot overwrite model once compiled".
export const ContactSubmission =
  models.ContactSubmission ?? model('ContactSubmission', contactSubmissionSchema);
