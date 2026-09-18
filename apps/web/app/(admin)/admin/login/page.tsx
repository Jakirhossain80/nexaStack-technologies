import type { Metadata } from 'next';

import { AuthCard } from '@/components/admin/AuthCard';
import { LoginForm } from '@/components/admin/LoginForm';

// noindex is already inherited from app/(admin)/admin/layout.tsx's metadata export.
export const metadata: Metadata = {
  title: 'Admin Sign In',
};

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin sign in" description="Sign in with your NexaStack admin account.">
      <LoginForm />
    </AuthCard>
  );
}
