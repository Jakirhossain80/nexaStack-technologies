import { ENQUIRY_STATUSES, enquiryStatusSchema } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentListFilters } from '@/components/admin/content/ContentListFilters';
import { LoadError } from '@/components/admin/content/LoadError';
import {
  ENQUIRY_STATUS_LABELS,
  EnquiryStatusBadge,
} from '@/components/admin/enquiries/EnquiryStatusBadge';
import { EnquiryExportButton } from '@/components/admin/enquiries/EnquiryExportButton';
import { Pagination } from '@/components/ui/Pagination';
import { company } from '@/config/company';
import { getEnquiryList } from '@/lib/adminEnquiries.server';

export const metadata: Metadata = {
  title: 'Enquiries',
};

interface EnquiriesPageProps {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
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
  options: ENQUIRY_STATUSES.map((status) => ({ value: status, label: ENQUIRY_STATUS_LABELS[status] })),
};

const VIEW_FILTER = {
  paramName: 'archived',
  label: 'View',
  allLabel: 'Active enquiries',
  options: [{ value: 'true', label: 'Archived enquiries' }],
};

/**
 * Contact-enquiry list. Search, status and the active/archived view are all URL search params and
 * all applied by the API in the database query (root CLAUDE.md 12): the page never filters a
 * fetched list itself, and the Export button downloads exactly this filtered set.
 */
export default async function EnquiriesPage({ searchParams }: EnquiriesPageProps) {
  const params = await searchParams;

  // The URL is untrusted: keep only well-formed values so a junk link shows an ordinary list rather
  // than an API validation error. The API re-validates everything regardless.
  const q = params.q?.trim().slice(0, 100) || undefined;
  const parsedStatus = enquiryStatusSchema.safeParse(params.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const archived = params.archived === 'true';
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const result = await getEnquiryList({ q, status, archived, page });
  const isFiltered = Boolean(q || status);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-semibold tracking-tight text-primary">Enquiries</h1>
          <p className="mt-2 text-body text-secondary">
            Messages from the contact form. Opening one marks it read.
          </p>
        </div>
        {result.ok && <EnquiryExportButton matchCount={result.data.total} />}
      </div>

      <ContentListFilters
        searchLabel="Search enquiries"
        searchPlaceholder="Name, email, subject or message"
        statusFilter={STATUS_FILTER}
        extraFilters={[VIEW_FILTER]}
      />

      {!result.ok ? (
        <LoadError subject="the enquiries" status={result.status} message={result.message} />
      ) : result.data.items.length === 0 ? (
        <p className="mt-8 text-body text-secondary">
          {isFiltered
            ? 'No enquiries match your search or filters.'
            : archived
              ? 'No archived enquiries.'
              : 'No enquiries yet.'}
        </p>
      ) : (
        <>
          <p className="mt-8 text-label text-secondary" role="status">
            Showing {result.data.items.length} of {result.data.total}{' '}
            {archived ? 'archived ' : ''}
            {result.data.total === 1 ? 'enquiry' : 'enquiries'}
          </p>
          <ul
            aria-label="Enquiries"
            className="mt-3 divide-y divide-default rounded-card border border-default bg-surface"
          >
            {result.data.items.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  href={`/admin/enquiries/${enquiry.id}`}
                  className="flex flex-col gap-3 px-4 py-4 text-body transition duration-150 ease-out hover:bg-surface-hover focus-ring md:flex-row md:items-center md:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-primary">
                      {enquiry.fullName} — {enquiry.subject}
                    </span>
                    <span className="block break-all text-label text-secondary">{enquiry.email}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <EnquiryStatusBadge status={enquiry.status} />
                    {enquiry.archived && (
                      <span className="text-label font-medium text-secondary">Archived</span>
                    )}
                    {enquiry.notesCount > 0 && (
                      <span className="text-label text-secondary">
                        {enquiry.notesCount} {enquiry.notesCount === 1 ? 'note' : 'notes'}
                      </span>
                    )}
                    <span className="text-label text-secondary">
                      {formatTimestamp(enquiry.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            basePath="/admin/enquiries"
            currentPage={result.data.page}
            totalPages={result.data.totalPages}
            currentParams={{ q, status, archived: archived ? 'true' : undefined }}
          />
        </>
      )}
    </div>
  );
}
