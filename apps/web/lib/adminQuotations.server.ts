import type { Paginated, QuotationAdminDetail, QuotationAdminSummary } from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side reads of the quotation-request admin API (`/api/v1/admin/quotations/*`). */

const QUOTATIONS_API = '/api/v1/admin/quotations';

export interface QuotationListParams {
  q?: string | undefined;
  /** Already validated against the quotation statuses by the caller. */
  status?: string | undefined;
  /** Already validated against the project types by the caller. */
  projectType?: string | undefined;
  archived?: boolean | undefined;
  page?: number | undefined;
}

function quotationQueryString(params: QuotationListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.projectType) search.set('projectType', params.projectType);
  if (params.archived) search.set('archived', 'true');
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getQuotationList(
  params: QuotationListParams,
): Promise<AdminReadResult<Paginated<QuotationAdminSummary>>> {
  return forwardedRead(`${QUOTATIONS_API}${quotationQueryString(params)}`);
}

/** The detail view. Unlike an enquiry, opening a quotation request changes nothing. */
export async function getQuotationDetail(
  id: string,
): Promise<AdminReadResult<QuotationAdminDetail>> {
  const result = await forwardedRead<{ quotation: QuotationAdminDetail }>(`${QUOTATIONS_API}/${id}`);
  return result.ok ? { ok: true, data: result.data.quotation } : result;
}
