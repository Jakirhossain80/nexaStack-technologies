'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminApiFetch } from '@/lib/adminApi';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await adminApiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      // Navigate regardless of network outcome — the session cookie is cleared server-side on
      // success, and even if the request failed, the protected layout's own session check on
      // the next navigation is the real guard, not this client-side redirect.
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={() => void handleLogout()} disabled={isLoggingOut}>
      {isLoggingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
