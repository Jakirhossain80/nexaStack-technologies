import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export interface DevLayoutProps {
  children: ReactNode;
}

/**
 * Everything under `/dev` is a developer tool (the design-token proof sheet and section previews), not part of
 * the site. Until now nothing stopped a production build serving them: they were only `noindex` and disallowed
 * in robots.txt, which hides a page from search engines but does not stop anyone opening the URL. A
 * production build now answers 404 for every one of them; `next dev` is unaffected.
 */
export default function DevLayout({ children }: Readonly<DevLayoutProps>) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
