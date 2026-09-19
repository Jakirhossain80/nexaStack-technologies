'use client';

import type { AdminUserAdmin, AdminUserCreated } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminUserRow } from '@/components/admin/users/AdminUserRow';
import { CreateAdminUserForm } from '@/components/admin/users/CreateAdminUserForm';
import { TemporaryPasswordPanel } from '@/components/admin/users/TemporaryPasswordPanel';

export interface AdminUsersManagerProps {
  users: AdminUserAdmin[];
  /** The signed-in admin's id, so their own row can say so and offer the right actions. */
  currentAdminId: string;
}

interface RevealedCredential {
  email: string;
  temporaryPassword: string;
  kind: 'created' | 'reset';
}

/**
 * Holds the two things that must outlive a row's refresh: the one-time temporary password (kept in
 * memory only, gone on navigation or reload, by design) and the live-region announcement of what just
 * changed. The list itself is server-rendered and refreshed after each action.
 */
export function AdminUsersManager({ users, currentAdminId }: Readonly<AdminUsersManagerProps>) {
  const router = useRouter();
  const [credential, setCredential] = useState<RevealedCredential | null>(null);
  const [notice, setNotice] = useState('');

  function onCreated(created: AdminUserCreated) {
    setCredential({ email: created.user.email, temporaryPassword: created.temporaryPassword, kind: 'created' });
    setNotice(`Account created for ${created.user.email}. Copy the temporary password below before leaving this page.`);
    router.refresh();
  }

  function onReset(created: AdminUserCreated) {
    setCredential({ email: created.user.email, temporaryPassword: created.temporaryPassword, kind: 'reset' });
  }

  return (
    <div>
      {/* Always mounted, so a screen reader announces each change as its text updates. Also visible. */}
      <p role="status" aria-live="polite" className="mt-6 min-h-6 text-body text-primary">
        {notice}
      </p>

      <CreateAdminUserForm onCreated={onCreated} />

      {credential && (
        <TemporaryPasswordPanel
          // A new credential (a second reset) is a new panel: fresh copy state, focus moves to it.
          key={credential.temporaryPassword}
          email={credential.email}
          temporaryPassword={credential.temporaryPassword}
          kind={credential.kind}
          onDismiss={() => setCredential(null)}
        />
      )}

      <h2 className="mt-10 text-card font-semibold text-primary">Accounts ({users.length})</h2>
      <ul aria-label="Admin accounts" className="mt-3 divide-y divide-default rounded-card border border-default bg-surface">
        {users.map((user) => (
          <AdminUserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentAdminId}
            onCredential={onReset}
            onNotice={setNotice}
          />
        ))}
      </ul>
    </div>
  );
}
