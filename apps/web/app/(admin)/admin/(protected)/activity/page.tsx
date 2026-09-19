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
