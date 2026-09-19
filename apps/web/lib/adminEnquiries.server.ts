import type { EnquiryAdminDetail, EnquiryAdminSummary, Paginated } from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side reads of the Contact-enquiry admin API (`/api/v1/admin/enquiries/*`). */

const ENQUIRIES_API = '/api/v1/admin/enquiries';

export interface EnquiryListParams {
  q?: string | undefined;
  /** Already validated against the enquiry statuses by the caller. */
  status?: string | undefined;
  archived?: boolean | undefined;
  page?: number | undefined;
}

function enquiryQueryString(params: EnquiryListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.archived) search.set('archived', 'true');
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getEnquiryList(
  params: EnquiryListParams,
): Promise<AdminReadResult<Paginated<EnquiryAdminSummary>>> {
  return forwardedRead(`${ENQUIRIES_API}${enquiryQueryString(params)}`);
}

/**
 * The detail view. NOTE: reading it is what marks a `new` enquiry `read` (server-side, once, and
 * audited), so only the detail page should call this.
 */
export async function getEnquiryDetail(id: string): Promise<AdminReadResult<EnquiryAdminDetail>> {
  const result = await forwardedRead<{ enquiry: EnquiryAdminDetail }>(`${ENQUIRIES_API}/${id}`);
  return result.ok ? { ok: true, data: result.data.enquiry } : result;
}
