import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { getAdminSession } from '@/lib/adminSession.server';

export interface ProtectedAdminLayoutProps {
  children: ReactNode;
}

/**
 * The real auth guard for everything under `(protected)` — `/admin/login`,
 * `/admin/forgot-password` and `/admin/reset-password` sit outside this route group
 * specifically so they're reachable without a session. A server-side check (not a client-side
 * redirect after render) so a protected page's content is never sent to an unauthenticated
 * browser in the first place.
 *
 * Minimal by design: an identity line, a small nav (one link per admin area that has a page of
 * its own) and a logout button. It is not a sidebar; add a link to `AdminNav` when a new area ships.
 */
export default async function ProtectedAdminLayout({ children }: Readonly<ProtectedAdminLayoutProps>) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <div className="page-container section-y">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <p className="text-label font-semibold text-primary">NexaStack Admin</p>
          <p className="text-label text-secondary">{admin.email}</p>
        </div>
        <AdminNav />
        <LogoutButton />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
