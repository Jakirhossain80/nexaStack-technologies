import type { Metadata } from 'next';

import { LoadError } from '@/components/admin/content/LoadError';
import { NoAccess } from '@/components/admin/NoAccess';
import { AdminUsersManager } from '@/components/admin/users/AdminUsersManager';
import { can, getAdminSession } from '@/lib/adminSession.server';
import { getAdminUsers } from '@/lib/adminUsers.server';

export const metadata: Metadata = {
  title: 'Admin Users',
};

/**
 * Admin accounts: create one, change a role, suspend or reactivate, reset a password. Needs
 * `manage:admins` (super admin only). There is no public sign-up: this is the only way an account
 * comes to exist. The API enforces the capability on every one of these actions; this page's own check
 * only avoids asking for data it would be refused.
 */
export default async function AdminUsersPage() {
  const admin = await getAdminSession();
  if (!admin || !can(admin, 'manage:admins')) return <NoAccess subject="admin accounts" />;

  const result = await getAdminUsers();

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Admin users</h1>
      <p className="mt-2 max-w-prose text-body text-secondary">
        Who can sign in to this admin, and what each of them can do. Suspending an account signs it out
        immediately. Accounts are never deleted, so the activity log keeps its history.
      </p>

      {result.ok ? (
        <AdminUsersManager users={result.data} currentAdminId={admin.id} />
      ) : (
        <LoadError subject="the admin accounts" status={result.status} message={result.message} />
      )}
    </div>
  );
}
