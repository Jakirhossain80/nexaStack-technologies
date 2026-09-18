import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { getEnquiries } from '@/lib/adminDashboard.server';

export const metadata: Metadata = {
  title: 'Enquiries',
};

interface EnquiriesPageProps {
  searchParams: Promise<{ status?: string }>;
}

// Intentionally minimal (dashboard task boundary): list + detail + a status toggle only.
// No filter UI, no search, no pagination — the one ?status= param is set by the dashboard's
// own quick-action links (root CLAUDE.md 12's URL-search-param convention), not a form.
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function EnquiriesPage({ searchParams }: EnquiriesPageProps) {
  const { status } = await searchParams;
  const filterStatus = status === 'new' || status === 'responded' ? status : undefined;
  const enquiries = await getEnquiries({ status: filterStatus, limit: 50 });

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Enquiries</h1>
      <p className="mt-2 text-body text-secondary">
        {filterStatus ? `Showing ${filterStatus} enquiries.` : 'All contact form submissions.'}
      </p>

      {enquiries.length === 0 ? (
        <p className="mt-8 text-body text-secondary">No enquiries to show.</p>
      ) : (
        <ul className="mt-8 divide-y divide-default rounded-card border border-default bg-surface">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id}>
              <Link
                href={`/admin/enquiries/${enquiry.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-body transition duration-150 ease-out hover:bg-surface-hover focus-ring sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-primary">
                  {enquiry.fullName} — {enquiry.subject}
                </span>
                <span className="flex items-center gap-3">
                  <Badge>{enquiry.status}</Badge>
                  <span className="text-label text-secondary">{formatTimestamp(enquiry.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
