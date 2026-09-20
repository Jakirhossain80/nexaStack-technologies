'use client';

import { RouteError } from '@/components/ui/RouteError';

export default function MarketingError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <RouteError error={error} reset={reset} homeHref="/" homeLabel="Go to the homepage" />;
}
