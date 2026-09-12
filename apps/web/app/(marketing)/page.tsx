import type { Metadata } from 'next';

import { TokenProofSheet } from './_proof-sheet/TokenProofSheet';

// TEMPORARY: this homepage is a design-token proof sheet for development only.
// Replace it with the real homepage and delete the _proof-sheet folder.

export const metadata: Metadata = {
  title: 'Design token proof sheet (temporary)',
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return <TokenProofSheet />;
}
