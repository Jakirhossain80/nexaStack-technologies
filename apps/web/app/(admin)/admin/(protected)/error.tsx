'use client';

import { RouteError } from '@/components/ui/RouteError';

const ADMIN_HINT =
  'If the admin service has been idle it can take up to a minute to wake up, so trying again shortly often works.';

/** Sits inside the protected layout, so the admin nav stays on screen and the shell is already padded. */
export default function ProtectedAdminError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <RouteError
      error={error}
      reset={reset}
      homeHref="/admin"
      homeLabel="Go to the admin dashboard"
      hint={ADMIN_HINT}
      embedded
    />
  );
}
