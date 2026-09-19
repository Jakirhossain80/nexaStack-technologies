'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { blogCategoryFormSchema, type BlogCategoryInput } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { FormField } from '@/components/admin/content/FormField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminRequest } from '@/lib/adminRequest';

interface CategoryFormFields {
  name: string;
}

/** Adds a category to the end of the display order. The URL slug is derived from the name. */
export function BlogCategoryCreateForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormFields, unknown, BlogCategoryInput>({
    resolver: zodResolver(blogCategoryFormSchema) as unknown as Resolver<
      CategoryFormFields,
      unknown,
      BlogCategoryInput
    >,
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setAdded(null);

    const result = await adminRequest('POST', '/api/v1/admin/blog/categories', data);
    if (!result.ok) {
      const nameIssue = result.error.details?.find((detail) => detail.path === 'name');
      if (nameIssue) setError('name', { message: nameIssue.message });
      else setServerError(result.error.message);
      return;
    }

    setAdded(`Added “${data.name}”.`);
    reset({ name: '' });
    router.refresh();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-card border border-default bg-surface p-4 md:p-5"
    >
      <h2 className="text-card font-semibold text-primary">Add a category</h2>

      {serverError && (
        <p
          role="alert"
          className="mt-4 rounded-field border border-error bg-surface px-4 py-3 text-body text-error"
        >
          {serverError}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <FormField
            id="new-category-name"
            label="Category name"
            required
            hint="Added to the end of the list. Use the arrows below to reorder."
            error={errors.name?.message}
          >
            <Input
              id="new-category-name"
              invalid={Boolean(errors.name)}
              aria-required="true"
              aria-describedby="new-category-name-hint new-category-name-error"
              {...register('name')}
            />
          </FormField>
        </div>
        <Button type="submit" disabled={isSubmitting} className="sm:mt-8">
          {isSubmitting ? 'Adding…' : 'Add category'}
        </Button>
      </div>

      <p role="status" className={added ? 'mt-3 text-body text-primary' : 'sr-only'}>
        {added}
      </p>
    </form>
  );
}
