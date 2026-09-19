'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ROLES,
  createAdminUserSchema,
  type AdminUserCreated,
  type CreateAdminUserInput,
  type Role,
} from '@nexastack/shared';
import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/adminRoles';
import { adminRequest } from '@/lib/adminRequest';

export interface CreateAdminUserFormProps {
  onCreated: (created: AdminUserCreated) => void;
}

interface CreateAdminUserFields {
  email: string;
  role: Role;
}

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const LABEL_CLASSES = 'block text-label font-medium text-primary';

/**
 * Creating an account takes an email and a role, and nothing else: there is no password field, because
 * the server generates a temporary one and returns it once. The default role is the least powerful, so
 * granting more is always a deliberate choice.
 */
export function CreateAdminUserForm({ onCreated }: Readonly<CreateAdminUserFormProps>) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminUserFields, unknown, CreateAdminUserInput>({
    resolver: zodResolver(createAdminUserSchema) as unknown as Resolver<
      CreateAdminUserFields,
      unknown,
      CreateAdminUserInput
    >,
    defaultValues: { email: '', role: 'content_editor' },
  });
  const role = useWatch({ control, name: 'role' });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const result = await adminRequest<AdminUserCreated>('POST', '/api/v1/admin/users', data);
    if (!result.ok) {
      setServerError(result.error.message);
      return;
    }
    reset();
    onCreated(result.data);
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="create-admin-heading"
      className="mt-8 rounded-card border border-default bg-surface p-5"
    >
      <h2 id="create-admin-heading" className="text-card font-semibold text-primary">
        Create an admin account
      </h2>
      <p className="mt-1 text-body text-secondary">
        A temporary password is generated and shown once after you create the account. There is no
        public sign-up.
      </p>

      {serverError && (
        <p role="alert" className="mt-4 rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          {serverError}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="new-admin-email" className={LABEL_CLASSES}>
            Email address <span aria-hidden="true">*</span>
          </label>
          <Input
            id="new-admin-email"
            type="email"
            autoComplete="off"
            invalid={Boolean(errors.email)}
            aria-required="true"
            aria-describedby="new-admin-email-error"
            className="mt-2"
            {...register('email')}
          />
          <FieldError id="new-admin-email-error" message={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="new-admin-role" className={LABEL_CLASSES}>
            Role <span aria-hidden="true">*</span>
          </label>
          <Select
            id="new-admin-role"
            options={ROLE_OPTIONS}
            invalid={Boolean(errors.role)}
            aria-required="true"
            aria-describedby="new-admin-role-hint new-admin-role-error"
            className="mt-2"
            {...register('role')}
          />
          <p id="new-admin-role-hint" className="mt-2 text-label text-secondary">
            {ROLE_DESCRIPTIONS[role]}
          </p>
          <FieldError id="new-admin-role-error" message={errors.role?.message} />
        </div>
      </div>

      <div className="mt-5">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
