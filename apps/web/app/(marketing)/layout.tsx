import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { WhatsAppWidget } from '@/components/layout/WhatsAppWidget';

export interface MarketingLayoutProps {
  children: ReactNode;
}

/**
 * Public site shell: shared Navbar and Footer on every route in this group. `WhatsAppWidget`
 * is mounted here rather than the root layout so it's excluded from `(admin)` (its own separate
 * layout) and `/dev/*` preview routes (outside both route groups) without any path checks.
 */
export default function MarketingLayout({ children }: Readonly<MarketingLayoutProps>) {
  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppWidget />
    </>
  );
}
