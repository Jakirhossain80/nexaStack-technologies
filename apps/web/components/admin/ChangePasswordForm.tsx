'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordFormSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type ApiResponse,
  type AuthenticatedAdmin,
  type ChangePasswordFormValues,
} from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { adminApiFetch } from '@/lib/adminApi';

export interface ChangePasswordFormProps {
  /** True when the account is on a temporary password and cannot use the admin until it is changed. */
  forced: boolean;
}

const DEFAULT_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};
const LABEL_CLASSES = 'block text-label font-medium text-primary';

/**
 * The forced first-login change and a voluntary one share this form. The current password is always
 * required (for a first login it is the temporary one), so a session left open on an unattended screen
 * cannot be used to change the password. The confirmation field is a typing check only; the API never
 * receives it. On success the API keeps THIS session and signs out the account's others.
 */
export function ChangePasswordForm({ forced }: Readonly<ChangePasswordFormProps>) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues, unknown, ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema) as unknown as Resolver<
      ChangePasswordFormValues,
      unknown,
      ChangePasswordFormValues
    >,
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);

    try {
      const response = await adminApiFetch('/api/v1/auth/change-password', {
        method: 'POST',
        // The confirmation is not sent: it only exists to catch a typing mistake in this form.
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const body = (await response.json()) as ApiResponse<{ admin: AuthenticatedAdmin }>;

      if (!body.success) {
        setServerError(body.error.message);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setServerError('Something went wrong changing your password. Please check your connection and try again.');
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && (
        <p role="alert" className="rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className={LABEL_CLASSES}>
          {forced ? 'Temporary password' : 'Current password'}
        </label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.currentPassword)}
          aria-required="true"
          aria-describedby="currentPassword-error"
          className="mt-2"
          {...register('currentPassword')}
        />
        <FieldError id="currentPassword-error" message={errors.currentPassword?.message} />
      </div>

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
          aria-describedby="newPassword-hint newPassword-error"
          className="mt-2"
          {...register('newPassword')}
        />
        <p id="newPassword-hint" className="mt-2 text-label text-secondary">
          {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} characters, and different from the current one.
        </p>
        <FieldError id="newPassword-error" message={errors.newPassword?.message} />
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className={LABEL_CLASSES}>
          Confirm new password
        </label>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmNewPassword)}
          aria-required="true"
          aria-describedby="confirmNewPassword-error"
          className="mt-2"
          {...register('confirmNewPassword')}
        />
        <FieldError id="confirmNewPassword-error" message={errors.confirmNewPassword?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
