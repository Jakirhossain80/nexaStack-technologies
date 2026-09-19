import type { ApiResponse } from '@nexastack/shared';
import { headers } from 'next/headers';

import { env } from '@/lib/env';

import type { AdminActivityEntry } from './adminSession.server';

/**
 * Same forwarded-cookie-fetch pattern as `adminSession.server.ts`'s `getAdminSession` /
 * `getRecentAdminActivity`: a Server Component can read the incoming request's cookies via
 * `next/headers`, but a server-to-server `fetch()` does not attach them automatically, so
 * every helper below forwards the `Cookie` header explicitly. All return a safe empty value
 * (`null` / `[]`) rather than throwing on failure — including a 403 from a role this session
 * doesn't have, which the RBAC middleware, not this helper, is responsible for enforcing.
 */
async function forwardedGet<T>(path: string): Promise<T | null> {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get('cookie');
  if (!cookie) return null;

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const body = (await response.json()) as ApiResponse<T>;
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export interface DashboardStats {
  contact: { total: number; new: number };
  quotation: { total: number; new: number };
}

/** `null` means "could not load" (not authenticated, not authorized, or the API is down) —
 * the dashboard renders a plain "not available" message for that section rather than a
 * fabricated zero, which would look identical to a real empty count. */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  return forwardedGet<DashboardStats>('/api/v1/admin/dashboard/stats');
}

export async function getRecentActivity(limit: number): Promise<AdminActivityEntry[]> {
  const data = await forwardedGet<{ entries: AdminActivityEntry[] }>(
    `/api/v1/admin/activity/recent?limit=${limit}`,
  );
  return data?.entries ?? [];
}

export interface EnquirySummary {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface SubmissionListParams {
  status?: 'new' | 'responded';
  limit?: number;
}

function listQueryString(params: SubmissionListParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * The newest Contact enquiries that still need attention: NOT archived and status `new` or
 * `read` (opened, but no follow-up recorded yet). `contacted` and `closed` are done, and an
 * archived enquiry has been put away. The enquiry list endpoint takes a comma list for `status`
 * and returns a paginated `{ items }` (Enquiry Management), read here.
 */
export async function getEnquiriesNeedingAttention(limit: number): Promise<EnquirySummary[]> {
  const data = await forwardedGet<{ items: EnquirySummary[] }>(
    `/api/v1/admin/enquiries?status=new,read&limit=${limit}`,
  );
  return data?.items ?? [];
}

export interface QuotationSummary {
  id: string;
  referenceNumber: string;
  fullName: string;
  email: string;
  projectType: string;
  status: string;
  createdAt: string;
}

export interface QuotationDetail extends QuotationSummary {
  telephone: string;
  companyName?: string;
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
  integrations?: string;
  referenceWebsites?: string[];
  budgetRange: string;
  preferredStartDate: string;
  targetCompletionDate?: string;
  maintenanceRequired: string;
  attachments?: string[];
  additionalMessage?: string;
  consent: boolean;
}

export async function getQuotations(params: SubmissionListParams = {}): Promise<QuotationSummary[]> {
  const data = await forwardedGet<{ quotations: QuotationSummary[] }>(
    `/api/v1/admin/quotations${listQueryString(params)}`,
  );
  return data?.quotations ?? [];
}

export async function getQuotationById(id: string): Promise<QuotationDetail | null> {
  const data = await forwardedGet<{ quotation: QuotationDetail }>(`/api/v1/admin/quotations/${id}`);
  return data?.quotation ?? null;
}
