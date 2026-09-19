import { ADMIN_EVENT_TYPES } from '@nexastack/shared';
import type { Metadata } from 'next';

import { AuditFilters } from '@/components/admin/AuditFilters';
import { LoadError } from '@/components/admin/content/LoadError';
import { NoAccess } from '@/components/admin/NoAccess';
import { Pagination } from '@/components/ui/Pagination';
import { company } from '@/config/company';
import { activityLabel } from '@/lib/activityLabels';
import { getAuditLog } from '@/lib/adminAudit.server';
import { can, getAdminSession } from '@/lib/adminSession.server';

export const metadata: Metadata = {
  title: 'Admin Activity',
};

interface AdminActivityPageProps {
  searchParams: Promise<{ event?: string; from?: string; to?: string; page?: string }>;
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

/** A real calendar day as `YYYY-MM-DD`, else undefined (the URL is untrusted; the API re-validates). */
function validDay(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

/**
 * The audit view: who did what, when. Needs `audit:view` (super admin and admin). Filter by event and by
 * date range; both live in the URL and are applied by the API in the database query, never by filtering a
 * fetched page here. Account-management events carry a one-line summary of what changed and to whom.
 */
export default async function AdminActivityPage({ searchParams }: Readonly<AdminActivityPageProps>) {
  const admin = await getAdminSession();
  if (!can(admin, 'audit:view')) return <NoAccess subject="the audit log" />;

  const params = await searchParams;

  const event = ADMIN_EVENT_TYPES.find((type) => type === params.event);
  const from = validDay(params.from);
  const to = validDay(params.to);
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const rangeIsBackwards = Boolean(from && to && from > to);
  const result = rangeIsBackwards ? null : await getAuditLog({ event, from, to, page });
  const isFiltered = Boolean(event || from || to);

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Activity</h1>
      <p className="mt-2 text-body text-secondary">
        Sign-ins, account changes and content actions across the admin, newest first.
      </p>

      <AuditFilters event={event} from={from} to={to} />

      {rangeIsBackwards ? (
        <p role="alert" className="mt-8 rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          The &ldquo;from&rdquo; date must be on or before the &ldquo;to&rdquo; date. Change one of them and
          apply the filters again.
        </p>
      ) : result && !result.ok ? (
        <LoadError subject="the audit log" status={result.status} message={result.message} />
      ) : result && result.data.items.length === 0 ? (
        <p className="mt-8 text-body text-secondary">
          {isFiltered ? 'No activity matches these filters.' : 'No activity recorded yet.'}
        </p>
      ) : result ? (
        <>
          <p className="mt-8 text-label text-secondary" role="status">
            Showing {result.data.items.length} of {result.data.total}{' '}
            {result.data.total === 1 ? 'event' : 'events'}
          </p>
          <div className="mt-3 overflow-x-auto rounded-card border border-default">
            <table className="w-full min-w-max text-left text-body">
              <caption className="sr-only">Admin activity, newest first</caption>
              <thead className="border-b border-default bg-background-alt">
                <tr>
                  {['Event', 'Details', 'By', 'When', 'IP address'].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3 text-label font-semibold text-primary">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-default last:border-b-0">
                    <td className="px-4 py-3 text-primary">{activityLabel(entry.eventType)}</td>
                    <td className="px-4 py-3 text-secondary">{entry.summary ?? '—'}</td>
                    <td className="px-4 py-3 text-secondary">
                      {entry.actorEmail ??
                        (entry.attemptedEmail ? `${entry.attemptedEmail} (typed at sign-in)` : '—')}
                    </td>
                    <td className="px-4 py-3 text-secondary">{formatTimestamp(entry.createdAt)}</td>
                    <td className="px-4 py-3 text-secondary">{entry.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            basePath="/admin/activity"
            currentPage={result.data.page}
            totalPages={result.data.totalPages}
            currentParams={{ event, from, to }}
          />
        </>
      ) : null}
    </div>
  );
}
