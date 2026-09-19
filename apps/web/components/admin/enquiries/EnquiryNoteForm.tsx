'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ENQUIRY_NOTE_MAX, enquiryNoteSchema, type EnquiryNoteInput } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { FormField } from '@/components/admin/content/FormField';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { adminRequest } from '@/lib/adminRequest';

export interface EnquiryNoteFormProps {
  enquiryId: string;
}

interface NoteFormFields {
  text: string;
}

/**
 * Add an internal note. Validation is the shared `enquiryNoteSchema` (the same schema the API
 * enforces, which is the security boundary). The confirmation is announced via a live region.
 */
export function EnquiryNoteForm({ enquiryId }: EnquiryNoteFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormFields, unknown, EnquiryNoteInput>({
    resolver: zodResolver(enquiryNoteSchema) as unknown as Resolver<
      NoteFormFields,
      unknown,
      EnquiryNoteInput
    >,
    defaultValues: { text: '' },
  });

  // `useWatch`, not `watch()`: the latter cannot be memoized by the React Compiler.
  const length = useWatch({ control, name: 'text' }).length;

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setAdded(false);

    const result = await adminRequest('POST', `/api/v1/admin/enquiries/${enquiryId}/notes`, data);
    if (!result.ok) {
      const issue = result.error.details?.find((detail) => detail.path === 'text');
      if (issue) setError('text', { message: issue.message });
      else setServerError(result.error.message);
      return;
    }

    reset({ text: '' });
    setAdded(true);
    router.refresh();
  });

  return (
    <form
      onSubmit={(event) => {
        // Ignore a second submit while saving. The button uses `aria-disabled`, not `disabled`, so
        // it keeps keyboard focus (a button that becomes `disabled` loses it).
        if (isSubmitting) {
          event.preventDefault();
          return;
        }
        void onSubmit(event);
      }}
      noValidate
    >
      {serverError && (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-4 py-3 text-body text-error"
        >
          {serverError}
        </p>
      )}

      <FormField
        id="enquiry-note"
        label="Add an internal note"
        required
        hint={`${length}/${ENQUIRY_NOTE_MAX} characters. Only admins can see notes; they can't be edited or deleted once added.`}
        error={errors.text?.message}
      >
        <Textarea
          id="enquiry-note"
          rows={4}
          invalid={Boolean(errors.text)}
          aria-required="true"
          aria-describedby="enquiry-note-hint enquiry-note-error"
          {...register('text', { onChange: () => setAdded(false) })}
        />
      </FormField>

      <Button
        type="submit"
        aria-disabled={isSubmitting || undefined}
        className="mt-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        {isSubmitting ? 'Adding…' : 'Add note'}
      </Button>

      {/* Always mounted so a screen reader announces "Note added." when it appears. */}
      <p role="status" className={added ? 'mt-3 text-body text-primary' : 'sr-only'}>
        {added ? 'Note added.' : ''}
      </p>
    </form>
  );
}
