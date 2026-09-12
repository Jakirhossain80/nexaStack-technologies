import type { ReactNode } from 'react';

export interface MarketingLayoutProps {
  children: ReactNode;
}

/** Public site shell. Navbar and Footer are added here when they are built. */
export default function MarketingLayout({ children }: Readonly<MarketingLayoutProps>) {
  return <main id="main-content">{children}</main>;
}
