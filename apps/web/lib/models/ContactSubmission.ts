import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A validated `/contact` page submission. Fields mirror `contactFormSchema` from
 * `@nexastack/shared` exactly — Zod is the security boundary (validated before this document
 * is constructed); these constraints are the second layer required by root CLAUDE.md 11.5.
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
    // No admin interface exists yet to transition this (root CLAUDE.md 22.2); left open rather
    // than enum-restricted so that work can define the full set of values when it's built.
    status: { type: String, required: true, default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ status: 1 });

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>;

// `models.ContactSubmission` is reused across hot reloads in development so Mongoose doesn't
// throw "Cannot overwrite model once compiled".
export const ContactSubmission =
  models.ContactSubmission ?? model('ContactSubmission', contactSubmissionSchema);
