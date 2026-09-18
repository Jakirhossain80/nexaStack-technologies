import { PROJECT_TYPE_OPTIONS } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { getQuotations } from '@/lib/adminDashboard.server';

export const metadata: Metadata = {
  title: 'Quotation requests',
};

interface QuotationsPageProps {
  searchParams: Promise<{ status?: string }>;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function projectTypeLabel(value: string): string {
  return PROJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const { status } = await searchParams;
  const filterStatus = status === 'new' || status === 'responded' ? status : undefined;
  const quotations = await getQuotations({ status: filterStatus, limit: 50 });

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Quotation requests</h1>
      <p className="mt-2 text-body text-secondary">
        {filterStatus ? `Showing ${filterStatus} requests.` : 'All quotation form submissions.'}
      </p>

      {quotations.length === 0 ? (
        <p className="mt-8 text-body text-secondary">No quotation requests to show.</p>
      ) : (
        <ul className="mt-8 divide-y divide-default rounded-card border border-default bg-surface">
          {quotations.map((quotation) => (
            <li key={quotation.id}>
              <Link
                href={`/admin/quotations/${quotation.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-body transition duration-150 ease-out hover:bg-surface-hover focus-ring sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-primary">
                  {quotation.fullName} — {projectTypeLabel(quotation.projectType)}
                  <span className="ml-2 font-mono text-label text-secondary">
                    {quotation.referenceNumber}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge>{quotation.status}</Badge>
                  <span className="text-label text-secondary">{formatTimestamp(quotation.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
