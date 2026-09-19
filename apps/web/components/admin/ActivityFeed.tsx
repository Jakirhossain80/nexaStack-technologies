import { activityLabel } from '@/lib/activityLabels';
import type { AdminActivityEntry } from '@/lib/adminSession.server';

export interface ActivityFeedProps {
  entries: AdminActivityEntry[];
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

// Labels come from `lib/activityLabels.ts`, the one map shared with `/admin/activity`.
export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return <p className="text-body text-secondary">No activity recorded yet.</p>;
  }

  return (
    <ul className="divide-y divide-default rounded-card border border-default bg-surface">
      {entries.map((entry) => (
        <li key={entry.id} className="px-4 py-3 text-body text-primary">
          {activityLabel(entry.eventType)} — {formatTimestamp(entry.createdAt)}
        </li>
      ))}
    </ul>
  );
}
