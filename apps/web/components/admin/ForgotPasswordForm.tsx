'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetRequestSchema, type ApiResponse, type PasswordResetRequestInput } from '@nexastack/shared';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { adminApiFetch } from '@/lib/adminApi';

interface ForgotPasswordFormFields {
  email: string;
}

const DEFAULT_VALUES: ForgotPasswordFormFields = { email: '' };
const LABEL_CLASSES = 'block text-label font-medium text-primary';

/** Always shows the same success message regardless of whether the email belongs to a real
 * account — matches apps/api's own generic response, so this page never confirms account
 * existence either. */
export function ForgotPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormFields, unknown, PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema) as unknown as Resolver<
      ForgotPasswordFormFields,
      unknown,
      PasswordResetRequestInput
    >,
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setStatus('submitting');

    try {
      const response = await adminApiFetch('/api/v1/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const body = (await response.json()) as ApiResponse<{ requested: true }>;

      if (!body.success) {
        setServerError(body.error.message);
        setStatus('idle');
        return;
      }

      setStatus('submitted');
    } catch {
      setServerError('Something went wrong sending that request. Please check your connection and try again.');
      setStatus('idle');
    }
  });

  if (status === 'submitted') {
    return (
      <div role="status" className="rounded-field border border-default bg-background-alt p-4">
        <p className="text-body text-secondary">
          If that email address has an account, a password reset link has been sent to it.
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
        <label htmlFor="email" className={LABEL_CLASSES}>
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          invalid={Boolean(errors.email)}
          aria-required="true"
          aria-describedby="email-error"
          className="mt-2"
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
