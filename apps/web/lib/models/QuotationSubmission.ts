import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A validated `/quotation` page submission. Fields mirror `quotationSchema` from
 * `@nexastack/shared` exactly — Zod is the security boundary (validated before this document
 * is constructed); these constraints are the second layer required by root CLAUDE.md 11.5.
 */
const quotationSubmissionSchema = new Schema(
  {
    // Traceable to the confirmation number shown to the submitter — derived from this same
    // document's real _id at insert time (see apps/web/app/api/quotation/route.ts).
    referenceNumber: { type: String, required: true, unique: true },

    // Step 1 — Client information
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    telephone: { type: String, required: true, trim: true, maxlength: 30 },
    companyName: { type: String, trim: true, maxlength: 160 },
    country: { type: String, required: true, trim: true },

    // Step 2 — Project information
    projectType: { type: String, required: true },
    requiredServices: { type: [String], required: true },
    businessObjectives: { type: String, required: true, trim: true, maxlength: 2000 },
    targetUsers: { type: String, required: true, trim: true, maxlength: 500 },
    projectStatus: { type: String, required: true, enum: ['new', 'existing'] },

    // Step 3 — Project requirements
    requiredFeatures: { type: String, required: true, trim: true, maxlength: 2000 },
    numberOfPages: { type: String, required: true },
    designRequirements: { type: String, required: true },
    needsAdminDashboard: { type: Boolean, required: true },
    needsAuthentication: { type: Boolean, required: true },
    integrations: { type: String, trim: true, maxlength: 1000 },
    referenceWebsites: { type: [String], default: undefined },

    // Step 4 — Budget and timeline
    budgetRange: { type: String, required: true },
    preferredStartDate: { type: String, required: true },
    targetCompletionDate: { type: String },
    maintenanceRequired: { type: String, required: true, enum: ['yes', 'no', 'not-sure'] },

    // Step 5 — Final submission
    attachments: { type: [String], default: undefined },
    additionalMessage: { type: String, trim: true, maxlength: 2000 },
    consent: { type: Boolean, required: true },

    // No admin interface exists yet to transition this (root CLAUDE.md 22.2); left open rather
    // than enum-restricted so that work can define the full set of values when it's built.
    status: { type: String, required: true, default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

quotationSubmissionSchema.index({ createdAt: -1 });
quotationSubmissionSchema.index({ status: 1 });

export type QuotationSubmissionDocument = InferSchemaType<typeof quotationSubmissionSchema>;

// `models.QuotationSubmission` is reused across hot reloads in development so Mongoose doesn't
// throw "Cannot overwrite model once compiled".
export const QuotationSubmission =
  models.QuotationSubmission ?? model('QuotationSubmission', quotationSubmissionSchema);
