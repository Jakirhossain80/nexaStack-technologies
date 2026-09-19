import { NotFoundError } from '../lib/errors.js';
import { QuotationSubmission } from '../models/QuotationSubmission.js';
import type { SubmissionStatus } from '../schemas/adminSubmissions.js';

// Quotation submissions only. Contact enquiries moved to adminEnquiries.service.ts.

export interface ListQuery {
  status?: SubmissionStatus;
  limit: number;
}

export interface QuotationSubmissionSummary {
  id: string;
  referenceNumber: string;
  fullName: string;
  email: string;
  projectType: string;
  status: string;
  createdAt: Date;
}

export interface QuotationSubmissionDetail extends QuotationSubmissionSummary {
  telephone: string;
  companyName: string | undefined;
  country: string;
  requiredServices: string[];
  businessObjectives: string;
  targetUsers: string;
  projectStatus: string;
  requiredFeatures: string;
  numberOfPages: string;
  designRequirements: string;
  needsAdminDashboard: boolean;
  needsAuthentication: boolean;
  integrations: string | undefined;
  referenceWebsites: string[] | undefined;
  budgetRange: string;
  preferredStartDate: string;
  targetCompletionDate: string | undefined;
  maintenanceRequired: string;
  attachments: string[] | undefined;
  additionalMessage: string | undefined;
  consent: boolean;
}

/**
 * `.lean()` throughout: display-only reads, per root CLAUDE.md 11.5.
 */

export async function listQuotationSubmissions(query: ListQuery): Promise<QuotationSubmissionSummary[]> {
  const filter = query.status ? { status: query.status } : {};
  const docs = await QuotationSubmission.find(filter).sort({ createdAt: -1 }).limit(query.limit).lean();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    referenceNumber: doc.referenceNumber,
    fullName: doc.fullName,
    email: doc.email,
    projectType: doc.projectType,
    status: doc.status,
    createdAt: doc.createdAt as Date,
  }));
}

export async function getQuotationSubmissionById(id: string): Promise<QuotationSubmissionDetail> {
  const doc = await QuotationSubmission.findById(id).lean();
  if (!doc) throw new NotFoundError('This quotation request was not found. It may have been removed.');

  return {
    id: doc._id.toString(),
    referenceNumber: doc.referenceNumber,
    fullName: doc.fullName,
    email: doc.email,
    telephone: doc.telephone,
    companyName: doc.companyName ?? undefined,
    country: doc.country,
    projectType: doc.projectType,
    requiredServices: doc.requiredServices,
    businessObjectives: doc.businessObjectives,
    targetUsers: doc.targetUsers,
    projectStatus: doc.projectStatus,
    requiredFeatures: doc.requiredFeatures,
    numberOfPages: doc.numberOfPages,
    designRequirements: doc.designRequirements,
    needsAdminDashboard: doc.needsAdminDashboard,
    needsAuthentication: doc.needsAuthentication,
    integrations: doc.integrations ?? undefined,
    referenceWebsites: doc.referenceWebsites ?? undefined,
    budgetRange: doc.budgetRange,
    preferredStartDate: doc.preferredStartDate,
    targetCompletionDate: doc.targetCompletionDate ?? undefined,
    maintenanceRequired: doc.maintenanceRequired,
    attachments: doc.attachments ?? undefined,
    additionalMessage: doc.additionalMessage ?? undefined,
    consent: doc.consent,
    status: doc.status,
    createdAt: doc.createdAt as Date,
  };
}

export async function updateQuotationSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<void> {
  const result = await QuotationSubmission.updateOne({ _id: id }, { status });
  if (result.matchedCount === 0) {
    throw new NotFoundError('This quotation request was not found. It may have been removed.');
  }
}
