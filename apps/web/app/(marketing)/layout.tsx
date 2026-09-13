import type { ReactNode } from 'react';

import { Navbar } from '@/components/layout/Navbar';

export interface MarketingLayoutProps {
  children: ReactNode;
}

/** Public site shell. The Footer is added here when it is built. */
export default function MarketingLayout({ children }: Readonly<MarketingLayoutProps>) {
  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
    </>
  );
}
