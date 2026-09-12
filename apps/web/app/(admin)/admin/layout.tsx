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
 * Admin shell. No admin pages exist yet (build phasing is an open decision, CLAUDE.md 22.2).
 *
 * TODO(admin phase): verify the session server-side here and redirect unauthenticated users.
 * This is a UX guard only — authorisation is enforced by `requireRole` on every API route.
 */
export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  return <main id="main-content">{children}</main>;
}
