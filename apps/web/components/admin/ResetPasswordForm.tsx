'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetConfirmSchema, type ApiResponse, type PasswordResetConfirmInput } from '@nexastack/shared';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { adminApiFetch } from '@/lib/adminApi';

interface ResetPasswordFormFields {
  newPassword: string;
}

const LABEL_CLASSES = 'block text-label font-medium text-primary';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormFields, unknown, PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema) as unknown as Resolver<
      ResetPasswordFormFields,
      unknown,
      PasswordResetConfirmInput
    >,
    defaultValues: { newPassword: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setStatus('submitting');

    try {
      const response = await adminApiFetch('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const body = (await response.json()) as ApiResponse<{ reset: true }>;

      if (!body.success) {
        setServerError(body.error.message);
        setStatus('idle');
        return;
      }

      setStatus('done');
    } catch {
      setServerError('Something went wrong resetting your password. Please check your connection and try again.');
      setStatus('idle');
    }
  });

  if (!token) {
    return (
      <p role="alert" className="rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
        This reset link is missing its token. Request a new one from the{' '}
        <Link href="/admin/forgot-password" className="underline underline-offset-4">
          forgot password
        </Link>{' '}
        page.
      </p>
    );
  }

  if (status === 'done') {
    return (
      <div role="status" className="rounded-field border border-default bg-background-alt p-4">
        <p className="text-body text-secondary">
          Your password has been reset. Every previous session has been signed out — you can now{' '}
          <Link href="/admin/login" className="text-primary-blue underline underline-offset-4 hover:text-primary-blue-hover">
            sign in
          </Link>{' '}
          with your new password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && (
        <p role="alert" className="rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="newPassword" className={LABEL_CLASSES}>
          New password
        </label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.newPassword)}
          aria-required="true"
          aria-describedby="newPassword-error"
          className="mt-2"
          {...register('newPassword')}
        />
        <FieldError id="newPassword-error" message={errors.newPassword?.message} />
      </div>

      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Resetting…' : 'Reset password'}
      </Button>
    </form>
  );
}
