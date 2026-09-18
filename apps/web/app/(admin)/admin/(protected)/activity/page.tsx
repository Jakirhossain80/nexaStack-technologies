import type { Metadata } from 'next';

import { getRecentAdminActivity } from '@/lib/adminSession.server';

export const metadata: Metadata = {
  title: 'Admin Activity',
};

const EVENT_LABELS: Record<string, string> = {
  login_success: 'Signed in',
  login_failure: 'Failed sign-in attempt',
  logout: 'Signed out',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default async function AdminActivityPage() {
  const entries = await getRecentAdminActivity();

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Activity</h1>
      <p className="mt-2 text-body text-secondary">
        The most recent sign-in and password-reset events for this account.
      </p>

      {entries.length === 0 ? (
        <p className="mt-8 text-body text-secondary">No activity recorded yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-default">
          <table className="w-full min-w-max text-left text-body">
            <caption className="sr-only">Recent admin account activity</caption>
            <thead className="border-b border-default bg-background-alt">
              <tr>
                <th scope="col" className="px-4 py-3 text-label font-semibold text-primary">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-label font-semibold text-primary">
                  When
                </th>
                <th scope="col" className="px-4 py-3 text-label font-semibold text-primary">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-label font-semibold text-primary">
                  IP address
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-default last:border-b-0">
                  <td className="px-4 py-3 text-primary">{EVENT_LABELS[entry.eventType] ?? entry.eventType}</td>
                  <td className="px-4 py-3 text-secondary">{formatTimestamp(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-secondary">{entry.attemptedEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-secondary">{entry.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
