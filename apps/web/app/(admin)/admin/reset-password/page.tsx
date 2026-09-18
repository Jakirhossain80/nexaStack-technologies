import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCard } from '@/components/admin/AuthCard';
import { ResetPasswordForm } from '@/components/admin/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Set New Admin Password',
};

export default function AdminResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a new password for your admin account.">
      {/* useSearchParams (reading the reset token) requires a Suspense boundary in the App
          Router — the form itself renders the same on server and client, so no meaningful
          fallback UI is needed. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
