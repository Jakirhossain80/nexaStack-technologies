import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

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
 * Minimal by design (root CLAUDE.md admin auth brief, section 5): a nav placeholder and a
 * logout button only — the rest of the admin dashboard (testimonial approval, a blog CMS) is
 * explicitly out of scope for this task.
 */
export default async function ProtectedAdminLayout({ children }: Readonly<ProtectedAdminLayoutProps>) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <div className="page-container section-y">
      <div className="flex items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <p className="text-label font-semibold text-primary">NexaStack Admin</p>
          <p className="text-label text-secondary">{admin.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
