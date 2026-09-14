import type { Metadata } from 'next';

import { TokenProofSheet } from './TokenProofSheet';

// Dev-only route, not linked from anywhere on the site. Kept for checking tokens as more
// sections are built; excluded from the sitemap (never in lib/routes.ts PUBLIC_ROUTES) and from
// indexing (noindex below, and "/dev" is in lib/routes.ts DISALLOWED_PATHS for robots.txt).

export const metadata: Metadata = {
  title: 'Design token proof sheet (dev only)',
  robots: { index: false, follow: false },
};

export default function DevTokensPage() {
  return <TokenProofSheet />;
}
