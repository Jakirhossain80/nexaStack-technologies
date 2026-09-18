import type { Metadata } from 'next';

import { AuthCard } from '@/components/admin/AuthCard';
import { ForgotPasswordForm } from '@/components/admin/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Admin Password',
};

export default function AdminForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your admin email address and, if it has an account, we'll send a reset link."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
