import type { AdminEventType } from '@nexastack/shared';

/**
 * How each audit event is worded in the admin: on `/admin/activity` (the table and its event filter)
 * and in the dashboard's recent-activity feed. Typed against the shared `AdminEventType`, so an event
 * added to the API without a label here fails typecheck instead of showing its raw name.
 */
export const ACTIVITY_LABELS: Record<AdminEventType, string> = {
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
  media_uploaded: 'Media file uploaded',
  media_updated: 'Media alt text or description edited',
  media_replaced: 'Media file replaced',
  media_deleted: 'Media file deleted',
  admin_account_created: 'Admin account created',
  admin_role_changed: 'Admin role changed',
  admin_account_suspended: 'Admin account suspended',
  admin_account_activated: 'Admin account reactivated',
  admin_password_reset: 'Admin password reset',
  password_changed: 'Password changed',
};

/** An event the web app has no label for (an API newer than this build) still reads as something. */
export function activityLabel(eventType: string): string {
  return (ACTIVITY_LABELS as Record<string, string>)[eventType] ?? eventType;
}
