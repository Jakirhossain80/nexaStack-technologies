import { ENQUIRY_STATUS, QUOTATION_STATUS } from '@nexastack/shared';
import mongoose from 'mongoose';

import { ContactSubmission } from '../models/ContactSubmission.js';
import { QuotationSubmission } from '../models/QuotationSubmission.js';

export interface DashboardStats {
  contact: { total: number; new: number };
  quotation: { total: number; new: number };
}

/**
 * Real, computed counts only — no estimate, no hardcoded number. Deliberately does not
 * include Services/Solutions/Projects/Technologies/Blog: those are static or stubbed data
 * that live in apps/web (config arrays, and lib/blog.ts's empty stub), not this API, and
 * are computed directly in the dashboard's Server Component instead of round-tripping here.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [contactTotal, contactNew, quotationTotal, quotationNew] = await Promise.all([
    ContactSubmission.countDocuments(),
    // "New" = never opened AND still in the active view. `archived: { $ne: true }` (not
    // `false`) so a legacy row without the field still counts. Enquiries with the richer
    // 4-state model: opened-but-not-followed-up ones ("read") are surfaced by the attention
    // list, not by this "new" count. `trusted`: `sanitizeFilter` would wrap a bare `$ne`.
    ContactSubmission.countDocuments({
      status: ENQUIRY_STATUS.NEW,
      archived: mongoose.trusted({ $ne: true }),
    }),
    QuotationSubmission.countDocuments(),
    // Same rule as enquiries: never looked at AND still in the active view (an archived request has
    // been put away). `archived: { $ne: true }` so a legacy row without the field still counts.
    QuotationSubmission.countDocuments({
      status: QUOTATION_STATUS.NEW,
      archived: mongoose.trusted({ $ne: true }),
    }),
  ]);

  return {
    contact: { total: contactTotal, new: contactNew },
    quotation: { total: quotationTotal, new: quotationNew },
  };
}
