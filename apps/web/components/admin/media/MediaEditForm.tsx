'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  MEDIA_ALT_TEXT_MAX,
  MEDIA_DESCRIPTION_MAX,
  MEDIA_TYPE,
  mediaDocumentMetadataSchema,
  mediaImageMetadataSchema,
  type MediaAdmin,
} from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { FormField } from '@/components/admin/content/FormField';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { adminRequest } from '@/lib/adminRequest';

export interface MediaEditFormProps {
  media: Pick<MediaAdmin, 'id' | 'mediaType' | 'altText' | 'description'>;
}

interface DescriptorFields {
  altText: string;
  description: string;
}

/**
 * Edit an item's alt text (image, REQUIRED: it can be changed but never emptied) or description
 * (document, optional). Validation is the shared schema the API also enforces, which is the security
 * boundary. The result is announced through an always-mounted live region.
 */
export function MediaEditForm({ media }: MediaEditFormProps) {
  const router = useRouter();
  const isImage = media.mediaType === MEDIA_TYPE.IMAGE;
  const name = isImage ? 'altText' : 'description';
  const max = isImage ? MEDIA_ALT_TEXT_MAX : MEDIA_DESCRIPTION_MAX;

  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DescriptorFields>({
    resolver: zodResolver(
      isImage ? mediaImageMetadataSchema : mediaDocumentMetadataSchema,
    ) as unknown as Resolver<DescriptorFields>,
    defaultValues: { altText: media.altText ?? '', description: media.description ?? '' },
  });

  // `useWatch`, not `watch()`: the latter cannot be memoized by the React Compiler.
  const length = useWatch({ control, name }).length;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);

    const result = await adminRequest('PATCH', `/api/v1/admin/media/${media.id}`, {
      [name]: values[name].trim(),
    });
    if (!result.ok) {
      const issue = result.error.details?.find((detail) => detail.path === name);
      if (issue) setError(name, { message: issue.message });
      else setServerError(result.error.message);
      return;
    }

    reset(values);
    setSaved(true);
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
        <p role="alert" className="mb-4 rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          {serverError}
        </p>
      )}

      <FormField
        id="media-edit-descriptor"
        label={isImage ? 'Alt text' : 'Description'}
        required={isImage}
        hint={
          isImage
            ? `What the image shows, for people who can't see it. Required. ${length}/${max} characters.`
            : `Optional: what this document is. ${length}/${max} characters.`
        }
        error={errors[name]?.message}
      >
        <Textarea
          id="media-edit-descriptor"
          rows={3}
          invalid={Boolean(errors[name])}
          aria-required={isImage ? 'true' : undefined}
          aria-describedby="media-edit-descriptor-hint media-edit-descriptor-error"
          {...register(name, { onChange: () => setSaved(false) })}
        />
      </FormField>

      <Button
        type="submit"
        aria-disabled={isSubmitting || undefined}
        className="mt-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save'}
      </Button>

      {/* Always mounted so a screen reader announces "Saved." when it appears. */}
      <p role="status" className={saved ? 'mt-3 text-body text-primary' : 'sr-only'}>
        {saved ? 'Saved.' : ''}
      </p>
    </form>
  );
}
