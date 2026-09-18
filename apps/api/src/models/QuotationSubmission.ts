import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * Read + status-update mirror of `apps/web/lib/models/QuotationSubmission.ts` — that file
 * remains the canonical, write-owning schema (the public `/quotation` form persists
 * through apps/web's own Route Handler, not through this API). Both apps point at the same
 * MongoDB database (see apps/web/.env.example and apps/api/.env.example) and the same
 * model name, so this resolves to the identical `quotationsubmissions` collection.
 *
 * `status` gets a real enum here (and in the canonical schema) now that this admin
 * interface exists to transition it — previously left open by design.
 */
const quotationSubmissionSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },

    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    telephone: { type: String, required: true, trim: true, maxlength: 30 },
    companyName: { type: String, trim: true, maxlength: 160 },
    country: { type: String, required: true, trim: true },

    projectType: { type: String, required: true },
    requiredServices: { type: [String], required: true },
    businessObjectives: { type: String, required: true, trim: true, maxlength: 2000 },
    targetUsers: { type: String, required: true, trim: true, maxlength: 500 },
    projectStatus: { type: String, required: true, enum: ['new', 'existing'] },

    requiredFeatures: { type: String, required: true, trim: true, maxlength: 2000 },
    numberOfPages: { type: String, required: true },
    designRequirements: { type: String, required: true },
    needsAdminDashboard: { type: Boolean, required: true },
    needsAuthentication: { type: Boolean, required: true },
    integrations: { type: String, trim: true, maxlength: 1000 },
    referenceWebsites: { type: [String], default: undefined },

    budgetRange: { type: String, required: true },
    preferredStartDate: { type: String, required: true },
    targetCompletionDate: { type: String },
    maintenanceRequired: { type: String, required: true, enum: ['yes', 'no', 'not-sure'] },

    attachments: { type: [String], default: undefined },
    additionalMessage: { type: String, trim: true, maxlength: 2000 },
    consent: { type: Boolean, required: true },

    status: { type: String, required: true, enum: ['new', 'responded'], default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type QuotationSubmissionDocument = InferSchemaType<typeof quotationSubmissionSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const QuotationSubmission =
  (models.QuotationSubmission as Model<QuotationSubmissionDocument> | undefined) ??
  model<QuotationSubmissionDocument>('QuotationSubmission', quotationSubmissionSchema);
