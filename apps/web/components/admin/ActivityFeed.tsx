import type { AdminActivityEntry } from '@/lib/adminSession.server';

export interface ActivityFeedProps {
  entries: AdminActivityEntry[];
}

// Same label set as /admin/activity's full table — only what AdminActivityLog actually
// records today (login/logout/password-reset events). As more admin actions get logged
// later, this feed (and the full activity page) will show them automatically.
const EVENT_LABELS: Record<string, string> = {
  login_success: 'Logged in',
  login_failure: 'Failed sign-in attempt',
  logout: 'Logged out',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return <p className="text-body text-secondary">No activity recorded yet.</p>;
  }

  return (
    <ul className="divide-y divide-default rounded-card border border-default bg-surface">
      {entries.map((entry) => (
        <li key={entry.id} className="px-4 py-3 text-body text-primary">
          {EVENT_LABELS[entry.eventType] ?? entry.eventType} — {formatTimestamp(entry.createdAt)}
        </li>
      ))}
    </ul>
  );
}
