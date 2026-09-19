'use client';

import {
  ADMIN_LOCK_MESSAGES,
  ADMIN_STATUS,
  ROLES,
  type AdminStatus,
  type AdminUserAdmin,
  type AdminUserCreated,
  type Role,
} from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { company } from '@/config/company';
import { ROLE_LABELS } from '@/lib/adminRoles';
import { adminRequest } from '@/lib/adminRequest';
import { cn } from '@/lib/cn';

export interface AdminUserRowProps {
  user: AdminUserAdmin;
  /** Whether this row is the signed-in admin's own account. */
  isSelf: boolean;
  /** A temporary password was generated (reset). The manager shows it once. */
  onCredential: (created: AdminUserCreated) => void;
  /** Something changed; the manager announces it in its live region. */
  onNotice: (message: string) => void;
}

type Confirming = 'suspend' | 'reset' | null;

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

const STATUS_LABELS: Record<AdminStatus, string> = {
  [ADMIN_STATUS.ACTIVE]: 'Active',
  [ADMIN_STATUS.SUSPENDED]: 'Suspended',
};

// Meaning is carried by the TEXT (never colour alone); the border colour reinforces it. Each pair is
// text-success / text-error / text-primary on `surface` or `background-alt`, ≥4.5:1 in both themes.
const STATUS_STYLES: Record<AdminStatus, string> = {
  [ADMIN_STATUS.ACTIVE]: 'border-success bg-surface text-success',
  [ADMIN_STATUS.SUSPENDED]: 'border-error bg-surface text-error',
};

const BADGE_CLASSES = 'inline-flex items-center rounded-full border px-3 py-1 text-label font-medium';
// aria-disabled (not `disabled`) keeps a blocked action focusable, so a keyboard or screen-reader user
// can reach it and read WHY it is blocked. The click does nothing; the reason is on screen beside it.
const BLOCKED_CLASSES = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

function formatDate(iso: string | null): string {
  if (!iso) return 'never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

/**
 * One admin account: who, role and status as words, and the actions a super admin has on it: change
 * role, suspend or reactivate, reset the password. A blocked action stays on screen and focusable with
 * its reason written next to it (last active super admin, or your own account). That is a courtesy: the
 * API refuses the same changes regardless (`lib/adminSafeguards.ts`), and shows the same wording.
 */
export function AdminUserRow({ user, isSelf, onCredential, onNotice }: Readonly<AdminUserRowProps>) {
  const router = useRouter();
  const [pickedRole, setPickedRole] = useState<Role | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suspended = user.status === ADMIN_STATUS.SUSPENDED;
  // Suspending and changing the role are blocked together (same safeguards); reactivating never is.
  const lockedReason = user.lockedReason;
  const roleBlocked = lockedReason !== null;
  const suspendBlocked = !suspended && lockedReason !== null;
  const resetBlocked = isSelf;

  const roleValue = pickedRole ?? user.role;
  const roleChanged = pickedRole !== null && pickedRole !== user.role;

  const ids = {
    role: `user-role-${user.id}`,
    reason: `user-reason-${user.id}`,
    resetReason: `user-reset-reason-${user.id}`,
    suspend: `user-suspend-${user.id}`,
    reset: `user-reset-${user.id}`,
    confirmYes: `user-confirm-yes-${user.id}`,
  };

  // Moving into the confirmation puts focus on its first button, so the keyboard user is not left
  // behind on the button they just pressed.
  useEffect(() => {
    if (confirming) document.getElementById(ids.confirmYes)?.focus();
  }, [confirming, ids.confirmYes]);

  function cancelConfirm(returnTo: 'suspend' | 'reset') {
    setConfirming(null);
    document.getElementById(returnTo === 'suspend' ? ids.suspend : ids.reset)?.focus();
  }

  async function saveRole() {
    if (roleBlocked || !roleChanged || pickedRole === null) return;
    setPending(true);
    setError(null);
    const result = await adminRequest<{ user: AdminUserAdmin }>(
      'PATCH',
      `/api/v1/admin/users/${user.id}/role`,
      { role: pickedRole },
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setPickedRole(null);
    onNotice(`${user.email} is now ${ROLE_LABELS[result.data.user.role]}.`);
    router.refresh();
  }

  async function changeStatus(status: AdminStatus) {
    setPending(true);
    setError(null);
    const result = await adminRequest<{ user: AdminUserAdmin }>(
      'PATCH',
      `/api/v1/admin/users/${user.id}/status`,
      { status },
    );
    setPending(false);
    setConfirming(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onNotice(
      status === ADMIN_STATUS.SUSPENDED
        ? `${user.email} is suspended and has been signed out everywhere.`
        : `${user.email} is active again. They can sign in with their existing password.`,
    );
    router.refresh();
    document.getElementById(ids.suspend)?.focus();
  }

  async function resetPassword() {
    setPending(true);
    setError(null);
    const result = await adminRequest<AdminUserCreated>(
      'POST',
      `/api/v1/admin/users/${user.id}/reset-password`,
    );
    setPending(false);
    setConfirming(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onCredential(result.data);
    onNotice(`A new temporary password was made for ${user.email}. Copy it before leaving this page.`);
    router.refresh();
  }

  return (
    <li className="px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-medium text-primary">
            {user.email}
            {isSelf && <span className="ml-2 text-label font-normal text-secondary">(you)</span>}
          </p>
          <p className="mt-1 text-label text-secondary">
            Created {formatDate(user.createdAt)}
            {user.createdByEmail ? ` by ${user.createdByEmail}` : ''} · Last sign-in{' '}
            {formatDate(user.lastLoginAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(BADGE_CLASSES, 'border-default bg-background-alt text-primary')}>
            {ROLE_LABELS[user.role]}
          </span>
          <span className={cn(BADGE_CLASSES, STATUS_STYLES[user.status])}>{STATUS_LABELS[user.status]}</span>
          {user.mustChangePassword && (
            <span className={cn(BADGE_CLASSES, 'border-dashed border-strong bg-surface text-primary')}>
              Temporary password
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={ids.role} className="block text-label font-medium text-primary">
            Role for {user.email}
          </label>
          <Select
            id={ids.role}
            options={ROLE_OPTIONS}
            value={roleValue}
            aria-disabled={roleBlocked || undefined}
            aria-describedby={roleBlocked ? ids.reason : undefined}
            // A blocked select stays controlled at its current value, so it can be reached and read
            // but not changed.
            onChange={(event) => {
              if (!roleBlocked) setPickedRole(event.target.value as Role);
            }}
            className="mt-2 min-w-48"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-disabled={roleBlocked || !roleChanged || pending || undefined}
          aria-describedby={roleBlocked ? ids.reason : undefined}
          onClick={() => void saveRole()}
          className={BLOCKED_CLASSES}
        >
          Save role
        </Button>

        <Button
          id={ids.suspend}
          type="button"
          variant="secondary"
          aria-disabled={suspendBlocked || pending || undefined}
          aria-describedby={suspendBlocked ? ids.reason : undefined}
          onClick={() => {
            if (suspendBlocked || pending) return;
            if (suspended) void changeStatus(ADMIN_STATUS.ACTIVE);
            else setConfirming('suspend');
          }}
          className={BLOCKED_CLASSES}
        >
          {suspended ? 'Reactivate' : 'Suspend'}
        </Button>

        <Button
          id={ids.reset}
          type="button"
          variant="secondary"
          aria-disabled={resetBlocked || pending || undefined}
          aria-describedby={resetBlocked ? ids.resetReason : undefined}
          onClick={() => {
            if (resetBlocked || pending) return;
            setConfirming('reset');
          }}
          className={BLOCKED_CLASSES}
        >
          Reset password
        </Button>
      </div>

      {lockedReason && (
        <p id={ids.reason} className="mt-3 max-w-prose text-label text-secondary">
          {ADMIN_LOCK_MESSAGES[lockedReason]}
        </p>
      )}
      {resetBlocked && (
        <p id={ids.resetReason} className="mt-3 max-w-prose text-label text-secondary">
          To change your own password, use &ldquo;Change password&rdquo; at the top of the page.
        </p>
      )}

      {confirming && (
        <div
          role="group"
          aria-label={confirming === 'suspend' ? `Confirm suspending ${user.email}` : `Confirm resetting the password for ${user.email}`}
          className="mt-4 flex flex-wrap items-center gap-3 rounded-field border border-default bg-background-alt p-3"
        >
          <span className="text-body text-primary">
            {confirming === 'suspend'
              ? 'Suspend this account? They are signed out everywhere at once and cannot sign in until reactivated.'
              : 'Reset this password? The current one stops working, they are signed out everywhere, and a new temporary password is shown once.'}
          </span>
          <Button
            id={ids.confirmYes}
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              void (confirming === 'suspend' ? changeStatus(ADMIN_STATUS.SUSPENDED) : resetPassword())
            }
          >
            {pending ? 'Working…' : confirming === 'suspend' ? 'Yes, suspend' : 'Yes, reset'}
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => cancelConfirm(confirming)}>
            Cancel
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-body text-error">
          {error}
        </p>
      )}
    </li>
  );
}
