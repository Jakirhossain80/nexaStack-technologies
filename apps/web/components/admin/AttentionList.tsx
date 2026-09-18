import { PROJECT_TYPE_OPTIONS } from '@nexastack/shared';
import Link from 'next/link';

import type { EnquirySummary, QuotationSummary } from '@/lib/adminDashboard.server';

function projectTypeLabel(value: string): string {
  return PROJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export interface AttentionListProps {
  enquiries: EnquirySummary[];
  quotations: QuotationSummary[];
}

interface AttentionItem {
  id: string;
  key: string;
  href: string;
  typeLabel: string;
  title: string;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/**
 * The newest unaddressed (status: new) enquiries and quotations, merged and sorted by date
 * — the dashboard's own real, actionable "content requiring attention," not just a count.
 * Both lists arrive already capped (status=new&limit=5) by the caller's API query.
 */
export function AttentionList({ enquiries, quotations }: AttentionListProps) {
  const items: AttentionItem[] = [
    ...enquiries.map((e) => ({
      id: e.id,
      key: `enquiry-${e.id}`,
      href: `/admin/enquiries/${e.id}`,
      typeLabel: 'Enquiry',
      title: `${e.fullName} — ${e.subject}`,
      createdAt: e.createdAt,
    })),
    ...quotations.map((q) => ({
      id: q.id,
      key: `quotation-${q.id}`,
      href: `/admin/quotations/${q.id}`,
      typeLabel: 'Quotation',
      title: `${q.fullName} — ${projectTypeLabel(q.projectType)}`,
      createdAt: q.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (items.length === 0) {
    return <p className="text-body text-secondary">Nothing needs attention right now.</p>;
  }

  return (
    <ul className="divide-y divide-default rounded-card border border-default bg-surface">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="flex flex-col gap-1 px-4 py-3 text-body transition duration-150 ease-out hover:bg-surface-hover focus-ring sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-primary">
              <span className="mr-2 text-label font-semibold text-primary-blue">{item.typeLabel}</span>
              {item.title}
            </span>
            <span className="text-label text-secondary">{formatTimestamp(item.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
