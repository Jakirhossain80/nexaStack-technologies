import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Outer admin shell — wraps every route under `(admin)`, authenticated or not, so the
 * `noindex` metadata below inherits down to all of them (verified, not re-declared per page).
 *
 * The actual session guard lives one level down, in
 * `app/(admin)/admin/(protected)/layout.tsx` — `/admin/login`, `/admin/forgot-password` and
 * `/admin/reset-password` sit outside that nested group specifically so they're reachable
 * without a session. This is a UX guard only; authorisation is always re-enforced by
 * `requireSession`/`requirePermission` on the API route itself, never by the UI alone.
 */
export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  // tabIndex={-1}: makes the skip link's target actually focusable — see the identical note in
  // the (marketing) layout, which has the same fix for the same reason.
  return (
    <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {children}
    </main>
  );
}
