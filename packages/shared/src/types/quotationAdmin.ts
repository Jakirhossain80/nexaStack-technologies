import type { z } from 'zod';

import type { QuotationStatus } from '../constants/quotationStatus.js';
import type { quotationNoteSchema, quotationStatusChangeSchema } from '../schemas/quotationAdmin.js';

export type QuotationNoteInput = z.infer<typeof quotationNoteSchema>;
export type QuotationStatusChangeInput = z.infer<typeof quotationStatusChangeSchema>;

/**
 * Response shapes of `/api/v1/admin/quotations/*`, as the admin UI receives them (JSON, so every
 * date is an ISO string). Written once here so the API and the web admin cannot drift.
 */

export interface QuotationNoteAdmin {
  id: string;
  text: string;
  createdAt: string;
  /** The admin who wrote it; null if that account no longer exists. */
  authorEmail: string | null;
}

/**
 * One uploaded file, as the admin sees it. The stored URL is deliberately NOT included: the browser
 * never receives a Cloudinary address, only this index, and asks the API to stream the file.
 */
export interface QuotationAttachmentAdmin {
  /** Position in the request's attachment list; the `:attachmentId` of the download endpoint. */
  index: number;
  /** The original file name if Cloudinary could report it, else a generic "Attachment n". */
  name: string;
  /** Upper-case file format such as `PDF`, `PNG`, `JPG`; null if it could not be determined. */
  format: string | null;
  /** Null if the size could not be looked up. */
  sizeBytes: number | null;
  /**
   * False when the stored value is not a recognisable NexaStack upload (for example a link a
   * submitter typed into the raw request). Such an entry is listed but has no download.
   */
  available: boolean;
}

export interface QuotationAdminSummary {
  id: string;
  referenceNumber: string;
  fullName: string;
  email: string;
  companyName: string | undefined;
  projectType: string;
  budgetRange: string;
  status: QuotationStatus;
  archived: boolean;
  createdAt: string;
  attachmentCount: number;
  notesCount: number;
}

export interface QuotationAdminDetail extends QuotationAdminSummary {
  // Step 1 — Client information
  telephone: string;
  country: string;
  // Step 2 — Project information
  requiredServices: string[];
  businessObjectives: string;
  targetUsers: string;
  projectStatus: string;
  // Step 3 — Project requirements
  requiredFeatures: string;
  numberOfPages: string;
  designRequirements: string;
  needsAdminDashboard: boolean;
  needsAuthentication: boolean;
  integrations: string | undefined;
  referenceWebsites: string[];
  // Step 4 — Budget and timeline
  preferredStartDate: string;
  targetCompletionDate: string | undefined;
  maintenanceRequired: string;
  // Step 5 — Final submission
  additionalMessage: string | undefined;
  attachments: QuotationAttachmentAdmin[];
  // Admin-only
  archivedAt: string | null;
  notes: QuotationNoteAdmin[];
}
