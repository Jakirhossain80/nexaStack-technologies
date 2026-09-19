import type { AdminActivityEntry } from '@/lib/adminSession.server';

export interface ActivityFeedProps {
  entries: AdminActivityEntry[];
}

// Same label set as /admin/activity's full table: every event type AdminActivityLog records
// (sign-in/password-reset, blog and enquiry actions). An event type missing here would show as its
// raw name, so add a label here and on that page whenever a new event type is added.
const EVENT_LABELS: Record<string, string> = {
  login_success: 'Logged in',
  login_failure: 'Failed sign-in attempt',
  logout: 'Logged out',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
  blog_post_created: 'Blog post created',
  blog_post_updated: 'Blog post edited',
  blog_post_published: 'Blog post published',
  blog_post_unpublished: 'Blog post unpublished',
  blog_post_archived: 'Blog post archived',
  blog_post_restored: 'Blog post restored to draft',
  blog_post_deleted: 'Blog post deleted',
  blog_category_created: 'Blog category created',
  blog_category_updated: 'Blog category renamed',
  blog_category_reordered: 'Blog categories reordered',
  blog_category_deleted: 'Blog category deleted',
  enquiry_marked_read: 'Enquiry opened (marked read)',
  enquiry_status_changed: 'Enquiry status changed',
  enquiry_note_added: 'Enquiry note added',
  enquiry_archived: 'Enquiry archived',
  enquiry_unarchived: 'Enquiry restored from archive',
  enquiry_exported: 'Enquiries exported to CSV',
  quotation_status_changed: 'Quotation status changed',
  quotation_note_added: 'Quotation note added',
  quotation_archived: 'Quotation archived',
  quotation_unarchived: 'Quotation restored from archive',
  quotation_exported: 'Quotations exported to CSV',
  quotation_attachment_downloaded: 'Quotation attachment downloaded',
  media_uploaded: 'Media file uploaded',
  media_updated: 'Media alt text or description edited',
  media_replaced: 'Media file replaced',
  media_deleted: 'Media file deleted',
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
