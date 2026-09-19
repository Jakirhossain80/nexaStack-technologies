import type { z } from 'zod';

import type { EnquiryStatus } from '../constants/enquiryStatus.js';
import type { enquiryNoteSchema, enquiryStatusChangeSchema } from '../schemas/enquiry.js';

export type EnquiryNoteInput = z.infer<typeof enquiryNoteSchema>;
export type EnquiryStatusChangeInput = z.infer<typeof enquiryStatusChangeSchema>;

/**
 * Response shapes of `/api/v1/admin/enquiries/*`, as the admin UI receives them (JSON, so every
 * date is an ISO string). Written once here so the API and the web admin cannot drift.
 */

export interface EnquiryNoteAdmin {
  id: string;
  text: string;
  createdAt: string;
  /** The admin who wrote it; null if that account no longer exists. */
  authorEmail: string | null;
}

export interface EnquiryAdminSummary {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  status: EnquiryStatus;
  archived: boolean;
  createdAt: string;
  notesCount: number;
}

export interface EnquiryAdminDetail extends EnquiryAdminSummary {
  phone: string | undefined;
  companyName: string | undefined;
  message: string;
  preferredContactMethod: string;
  archivedAt: string | null;
  notes: EnquiryNoteAdmin[];
}
