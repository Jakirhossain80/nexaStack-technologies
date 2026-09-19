import type { Role } from '@nexastack/shared';

/**
 * A short, human sentence for the account-management audit events, so the audit view can say WHAT
 * happened and to WHOM, not just that something did. Pure, and it reads only the safe fields those
 * events record (target email, role, from/to): the log never holds a password, and this never prints one.
 * Every other event type returns null (their row already says enough).
 */

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'super admin',
  admin: 'admin',
  content_editor: 'content editor',
};

function roleLabel(value: unknown): string {
  return typeof value === 'string' && value in ROLE_LABELS ? ROLE_LABELS[value as Role] : 'unknown role';
}

function text(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : 'an account';
}

export function summarizeAdminEvent(
  eventType: string,
  metadata: Record<string, unknown> | undefined,
): string | null {
  const m = metadata ?? {};
  switch (eventType) {
    case 'admin_account_created':
      return `Created ${text(m.targetEmail)} as ${roleLabel(m.role)}`;
    case 'admin_role_changed':
      return `${text(m.targetEmail)}: ${roleLabel(m.from)} → ${roleLabel(m.to)}`;
    case 'admin_account_suspended':
      return `Suspended ${text(m.targetEmail)}`;
    case 'admin_account_activated':
      return `Reactivated ${text(m.targetEmail)}`;
    case 'admin_password_reset':
      return `Reset the temporary password for ${text(m.targetEmail)}`;
    case 'password_changed':
      return m.forced === true ? 'Changed their temporary password' : 'Changed their password';
    default:
      return null;
  }
}
