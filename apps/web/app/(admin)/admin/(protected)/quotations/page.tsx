import { PROJECT_TYPE_OPTIONS, QUOTATION_STATUSES, quotationStatusSchema } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentListFilters } from '@/components/admin/content/ContentListFilters';
import { LoadError } from '@/components/admin/content/LoadError';
import { QuotationExportButton } from '@/components/admin/quotations/QuotationExportButton';
import {
  QUOTATION_STATUS_LABELS,
  QuotationStatusBadge,
} from '@/components/admin/quotations/QuotationStatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { company } from '@/config/company';
import { getQuotationList } from '@/lib/adminQuotations.server';
import { budgetRangeLabel, projectTypeLabel } from '@/lib/quotationLabels';

export const metadata: Metadata = {
  title: 'Quotation requests',
};

interface QuotationsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    projectType?: string;
    archived?: string;
    page?: string;
  }>;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

const STATUS_FILTER = {
  paramName: 'status',
  label: 'Status',
  allLabel: 'All statuses',
  options: QUOTATION_STATUSES.map((status) => ({
    value: status,
    label: QUOTATION_STATUS_LABELS[status],
  })),
};

const PROJECT_TYPE_FILTER = {
  paramName: 'projectType',
  label: 'Project type',
  allLabel: 'All project types',
  options: PROJECT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
};

const VIEW_FILTER = {
  paramName: 'archived',
  label: 'View',
  allLabel: 'Active requests',
  options: [{ value: 'true', label: 'Archived requests' }],
};

/**
 * Quotation-request list. Search, status, project type and the active/archived view are all URL
 * search params and all applied by the API in the database query (root CLAUDE.md 12): the page never
 * filters a fetched list itself, and the Export button downloads exactly this filtered set.
 */
export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const params = await searchParams;

  // The URL is untrusted: keep only well-formed values so a junk link shows an ordinary list rather
  // than an API validation error. The API re-validates everything regardless.
  const q = params.q?.trim().slice(0, 100) || undefined;
  const parsedStatus = quotationStatusSchema.safeParse(params.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const projectType = PROJECT_TYPE_OPTIONS.some((option) => option.value === params.projectType)
    ? params.projectType
    : undefined;
  const archived = params.archived === 'true';
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const result = await getQuotationList({ q, status, projectType, archived, page });
  const isFiltered = Boolean(q || status || projectType);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-semibold tracking-tight text-primary">Quotation requests</h1>
          <p className="mt-2 text-body text-secondary">
            Requests from the quotation form, from new through to accepted or declined.
          </p>
        </div>
        {result.ok && <QuotationExportButton matchCount={result.data.total} />}
      </div>

      <ContentListFilters
        searchLabel="Search quotation requests"
        searchPlaceholder="Name, email, company, reference or project"
        statusFilter={STATUS_FILTER}
        extraFilters={[PROJECT_TYPE_FILTER, VIEW_FILTER]}
      />

      {!result.ok ? (
        <LoadError subject="the quotation requests" status={result.status} message={result.message} />
      ) : result.data.items.length === 0 ? (
        <p className="mt-8 text-body text-secondary">
          {isFiltered
            ? 'No quotation requests match your search or filters.'
            : archived
              ? 'No archived quotation requests.'
              : 'No quotation requests yet.'}
        </p>
      ) : (
        <>
          <p className="mt-8 text-label text-secondary" role="status">
            Showing {result.data.items.length} of {result.data.total}{' '}
            {archived ? 'archived ' : ''}
            {result.data.total === 1 ? 'request' : 'requests'}
          </p>
          <ul
            aria-label="Quotation requests"
            className="mt-3 divide-y divide-default rounded-card border border-default bg-surface"
          >
            {result.data.items.map((quotation) => (
              <li key={quotation.id}>
                <Link
                  href={`/admin/quotations/${quotation.id}`}
                  className="flex flex-col gap-3 px-4 py-4 text-body transition duration-150 ease-out hover:bg-surface-hover focus-ring md:flex-row md:items-center md:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-primary">
                      {quotation.fullName} — {projectTypeLabel(quotation.projectType)}
                    </span>
                    <span className="block text-label break-all text-secondary">
                      {quotation.email}
                      {quotation.companyName ? ` · ${quotation.companyName}` : ''}
                    </span>
                    <span className="block text-label text-secondary">
                      <span className="font-mono">{quotation.referenceNumber}</span>
                      {' · '}
                      {budgetRangeLabel(quotation.budgetRange)}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <QuotationStatusBadge status={quotation.status} />
                    {quotation.archived && (
                      <span className="text-label font-medium text-secondary">Archived</span>
                    )}
                    {quotation.attachmentCount > 0 && (
                      <span className="text-label text-secondary">
                        {quotation.attachmentCount}{' '}
                        {quotation.attachmentCount === 1 ? 'file' : 'files'}
                      </span>
                    )}
                    {quotation.notesCount > 0 && (
                      <span className="text-label text-secondary">
                        {quotation.notesCount} {quotation.notesCount === 1 ? 'note' : 'notes'}
                      </span>
                    )}
                    <span className="text-label text-secondary">
                      {formatTimestamp(quotation.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            basePath="/admin/quotations"
            currentPage={result.data.page}
            totalPages={result.data.totalPages}
            currentParams={{
              q,
              status,
              projectType,
              archived: archived ? 'true' : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}
