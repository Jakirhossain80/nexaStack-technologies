import { ADMIN_EVENT_TYPES } from '@nexastack/shared';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ACTIVITY_LABELS } from '@/lib/activityLabels';

export interface AuditFiltersProps {
  event: string | undefined;
  from: string | undefined;
  to: string | undefined;
}

const LABEL_CLASSES = 'block text-label font-medium text-primary';

const EVENT_OPTIONS = [
  { value: '', label: 'All events' },
  ...ADMIN_EVENT_TYPES.map((type) => ({ value: type, label: ACTIVITY_LABELS[type] })),
];

/**
 * The audit view's filters. A plain GET form: submitting it puts `event`, `from` and `to` in the URL
 * (root CLAUDE.md 12), so a filtered view is shareable, bookmarkable and correct under the back button,
 * and it works with no client JavaScript at all. Dates are days in Asia/Dhaka, both inclusive.
 */
export function AuditFilters({ event, from, to }: Readonly<AuditFiltersProps>) {
  const isFiltered = Boolean(event || from || to);

  return (
    <form
      method="get"
      action="/admin/activity"
      aria-label="Filter the audit log"
      className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
    >
      <div>
        <label htmlFor="audit-event" className={LABEL_CLASSES}>
          Event
        </label>
        <Select
          id="audit-event"
          name="event"
          defaultValue={event ?? ''}
          options={EVENT_OPTIONS}
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="audit-from" className={LABEL_CLASSES}>
          From (Dhaka time)
        </label>
        <Input id="audit-from" name="from" type="date" defaultValue={from ?? ''} className="mt-2" />
      </div>
      <div>
        <label htmlFor="audit-to" className={LABEL_CLASSES}>
          To (Dhaka time)
        </label>
        <Input id="audit-to" name="to" type="date" defaultValue={to ?? ''} className="mt-2" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Apply filters</Button>
        {isFiltered && (
          <Link
            href="/admin/activity"
            className="inline-flex min-h-11 items-center rounded-field px-3 text-body text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
