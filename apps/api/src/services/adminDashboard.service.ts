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
    ContactSubmission.countDocuments({ status: 'new' }),
    QuotationSubmission.countDocuments(),
    QuotationSubmission.countDocuments({ status: 'new' }),
  ]);

  return {
    contact: { total: contactTotal, new: contactNew },
    quotation: { total: quotationTotal, new: quotationNew },
  };
}
