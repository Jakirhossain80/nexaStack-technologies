/**
 * Every event the admin audit log can hold. One list, in shared, so the API's model and audit filter and
 * the web app's labels agree: the web's label map is typed `Record<AdminEventType, string>`, so adding an
 * event here without a label fails typecheck instead of showing a raw name in the audit view.
 */
export const ADMIN_EVENT_TYPES = [
  'login_success',
  'login_failure',
  'logout',
  'password_reset_requested',
  'password_reset_completed',
  'blog_post_created',
  'blog_post_updated',
  'blog_post_published',
  'blog_post_unpublished',
  'blog_post_archived',
  'blog_post_restored',
  'blog_post_deleted',
  'blog_category_created',
  'blog_category_updated',
  'blog_category_reordered',
  'blog_category_deleted',
  'enquiry_marked_read',
  'enquiry_status_changed',
  'enquiry_note_added',
  'enquiry_archived',
  'enquiry_unarchived',
  'enquiry_exported',
  'quotation_status_changed',
  'quotation_note_added',
  'quotation_archived',
  'quotation_unarchived',
  'quotation_exported',
  'quotation_attachment_downloaded',
  'media_uploaded',
  'media_updated',
  'media_replaced',
  'media_deleted',
  'admin_account_created',
  'admin_role_changed',
  'admin_account_suspended',
  'admin_account_activated',
  'admin_password_reset',
  'password_changed',
] as const;

export type AdminEventType = (typeof ADMIN_EVENT_TYPES)[number];
