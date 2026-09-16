import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export interface MarketingLayoutProps {
  children: ReactNode;
}

/** Public site shell: shared Navbar and Footer on every route in this group. */
export default function MarketingLayout({ children }: Readonly<MarketingLayoutProps>) {
  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
