'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  MEDIA_ACCEPT_ATTRIBUTE,
  MEDIA_ALLOWED_TYPES_TEXT,
  MEDIA_ALT_TEXT_MAX,
  MEDIA_DESCRIPTION_MAX,
  MEDIA_PDF_MAX_BYTES,
  MEDIA_RASTER_MAX_BYTES,
  MEDIA_SVG_MAX_BYTES,
  MEDIA_TYPE,
  mediaDocumentMetadataSchema,
  mediaImageMetadataSchema,
  type MediaAdmin,
  type MediaType,
} from '@nexastack/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { FormField } from '@/components/admin/content/FormField';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { adminFormRequest } from '@/lib/adminFormRequest';
import { cn } from '@/lib/cn';
import { formatFileSize } from '@/lib/quotationLabels';

interface DescriptorFields {
  altText: string;
  description: string;
}

interface Classified {
  mediaType: MediaType;
  maxBytes: number;
}

/**
 * A quick, client-side guess from the file's extension, ONLY to show the right field and a friendly
 * message at once. The server decides from the file's real bytes and is the security boundary: a
 * file that passes here can still be refused there, and a wrong guess here cannot get anything in.
 */
function classify(file: File): Classified | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.svg')) return { mediaType: MEDIA_TYPE.IMAGE, maxBytes: MEDIA_SVG_MAX_BYTES };
  if (['.jpg', '.jpeg', '.png', '.webp'].some((ext) => name.endsWith(ext))) {
    return { mediaType: MEDIA_TYPE.IMAGE, maxBytes: MEDIA_RASTER_MAX_BYTES };
  }
  if (name.endsWith('.pdf')) return { mediaType: MEDIA_TYPE.DOCUMENT, maxBytes: MEDIA_PDF_MAX_BYTES };
  return null;
}

/**
 * Upload a file, with the description in the SAME form: an image cannot be uploaded without alt text
 * (there is no later step to skip), and a document takes an optional description instead. The
 * allowed types and sizes are printed above the file control, so nobody has to fail to find them out.
 * Drag-and-drop is an enhancement over the native file input, which alone is fully keyboard and
 * screen-reader operable.
 */
export function MediaUploadForm() {
  const router = useRouter();
  const rulesId = useId();
  const fileInputId = useId();
  const statusId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<Classified | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [created, setCreated] = useState<MediaAdmin | null>(null);
  // Bumped after a successful upload to remount the file input, which clears the browser's own
  // record of the chosen file without touching the element from inside the submit handler.
  const [inputKey, setInputKey] = useState(0);

  const isImage = kind?.mediaType !== MEDIA_TYPE.DOCUMENT;

  // The schema depends on what was chosen: alt text (required) for an image, an optional description
  // for a document. Both come from @nexastack/shared, the same rules the API enforces.
  const resolver = useMemo(
    () =>
      zodResolver(
        isImage ? mediaImageMetadataSchema : mediaDocumentMetadataSchema,
      ) as unknown as Resolver<DescriptorFields>,
    [isImage],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<DescriptorFields>({
    resolver,
    defaultValues: { altText: '', description: '' },
  });

  const descriptorName = isImage ? 'altText' : 'description';
  const max = isImage ? MEDIA_ALT_TEXT_MAX : MEDIA_DESCRIPTION_MAX;
  // `useWatch`, not `watch()`: the latter cannot be memoized by the React Compiler.
  const length = useWatch({ control, name: descriptorName }).length;

  function choose(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    setCreated(null);
    setFormError(null);

    const classified = classify(picked);
    if (!classified) {
      setFile(null);
      setKind(null);
      setFileError(
        `“${picked.name}” isn't an accepted type. ${MEDIA_ALLOWED_TYPES_TEXT}`,
      );
      setAnnouncement(`${picked.name} is not an accepted type.`);
      return;
    }
    if (picked.size === 0) {
      setFile(null);
      setKind(null);
      setFileError(`“${picked.name}” is empty. Please choose another file.`);
      return;
    }
    if (picked.size > classified.maxBytes) {
      setFile(null);
      setKind(null);
      setFileError(
        `“${picked.name}” is ${formatFileSize(picked.size)}, over the ${formatFileSize(classified.maxBytes)} limit for this type.`,
      );
      setAnnouncement(`${picked.name} is too large.`);
      return;
    }

    setFile(picked);
    setKind(classified);
    setFileError(null);
    setAnnouncement(
      `${picked.name} selected. ${classified.mediaType === MEDIA_TYPE.IMAGE ? 'Alt text is required.' : 'A description is optional.'}`,
    );
  }

  function clearFile() {
    setFile(null);
    setKind(null);
    setFileError(null);
    setAnnouncement('File removed.');
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!file || !kind) {
      setFileError('Please choose a file to upload.');
      return;
    }
    setFormError(null);
    setCreated(null);

    const body = new FormData();
    body.append('file', file);
    const descriptor = (isImage ? values.altText : values.description).trim();
    if (descriptor) body.append(descriptorName, descriptor);

    const result = await adminFormRequest<{ media: MediaAdmin }>('POST', '/api/v1/admin/media', body);
    if (!result.ok) {
      const issues = result.error.details ?? [];
      const forDescriptor = issues.find((issue) => issue.path === descriptorName);
      const forFile = issues.find((issue) => issue.path === 'file');
      if (forDescriptor) {
        setError(descriptorName, { message: forDescriptor.message });
        setFocus(descriptorName);
      }
      if (forFile) setFileError(forFile.message);
      if (!forDescriptor && !forFile) setFormError(result.error.message);
      setAnnouncement('The upload failed. See the message on the form.');
      return;
    }

    setCreated(result.data.media);
    clearFile();
    setInputKey((key) => key + 1);
    setAnnouncement(`${result.data.media.filename} uploaded.`);
    reset({ altText: '', description: '' });
    router.refresh();
  });

  return (
    <section aria-labelledby="upload-heading" className="rounded-card border border-default bg-surface p-5 sm:p-6">
      <h2 id="upload-heading" className="text-card font-semibold text-primary">
        Upload a file
      </h2>
      <p id={rulesId} className="mt-1 text-label text-secondary">
        {MEDIA_ALLOWED_TYPES_TEXT} Images need alt text; documents can have a description.
      </p>

      <form
        onSubmit={(event) => {
          // Ignore a second submit while uploading. The button uses `aria-disabled`, not `disabled`,
          // so it keeps keyboard focus (a button that becomes `disabled` loses it).
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          // No file yet: say so and move to the file control, rather than showing an alt-text error
          // for a field that is not even on the page.
          if (!file) {
            event.preventDefault();
            setFileError('Please choose a file to upload.');
            fileInputRef.current?.focus();
            return;
          }
          void onSubmit(event);
        }}
        noValidate
        className="mt-5 space-y-6"
      >
        {formError && (
          <p role="alert" className="rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
            {formError}
          </p>
        )}

        <div>
          <label
            htmlFor={fileInputId}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              choose(event.dataTransfer.files);
            }}
            className={cn(
              'flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-field border border-dashed px-4 py-6 text-center text-body text-secondary focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-blue',
              dragActive ? 'border-primary-blue bg-surface-hover' : 'border-strong bg-surface',
              fileError && 'border-error',
            )}
          >
            <span className="text-body font-medium text-primary">
              {file ? 'Choose a different file' : 'Drag a file here or click to choose one'}
            </span>
            <span className="text-label text-secondary">One file at a time</span>
            <input
              key={inputKey}
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept={MEDIA_ACCEPT_ATTRIBUTE}
              className="sr-only"
              aria-describedby={`${rulesId} ${statusId}`}
              aria-invalid={fileError ? true : undefined}
              onChange={(event) => choose(event.target.files)}
            />
          </label>
          {fileError && (
            <p role="alert" className="mt-2 text-label text-error">
              {fileError}
            </p>
          )}

          {file && kind && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-field border border-default bg-surface px-3.5 py-2.5">
              <p className="min-w-0 text-body text-primary">
                <span className="break-all font-medium">{file.name}</span>
                <span className="text-secondary">
                  {' '}
                  · {isImage ? 'Image' : 'Document'} · {formatFileSize(file.size)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  clearFile();
                  // The Remove button is about to disappear: hand focus to the file control so a
                  // keyboard user keeps their place, and clear the browser's chosen file.
                  const input = fileInputRef.current;
                  if (input) {
                    input.value = '';
                    input.focus();
                  }
                }}
                className="min-h-11 rounded-field px-2 text-label text-error underline underline-offset-4 focus-ring"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {file && kind && (
          <FormField
            id="media-descriptor"
            label={isImage ? 'Alt text' : 'Description'}
            required={isImage}
            hint={
              isImage
                ? `Describe what the image shows, for people who can't see it. ${length}/${max} characters.`
                : `Optional: what this document is. ${length}/${max} characters.`
            }
            error={errors[descriptorName]?.message}
          >
            <Textarea
              id="media-descriptor"
              rows={3}
              invalid={Boolean(errors[descriptorName])}
              aria-required={isImage ? 'true' : undefined}
              aria-describedby="media-descriptor-hint media-descriptor-error"
              {...register(descriptorName)}
            />
          </FormField>
        )}

        <Button
          type="submit"
          aria-disabled={isSubmitting || !file || undefined}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading…' : 'Upload'}
        </Button>

        {/* Always mounted so a screen reader announces each step as it happens. */}
        <p id={statusId} role="status" className="sr-only">
          {announcement}
        </p>
        {created && (
          <p className="text-body text-primary">
            Uploaded <strong className="font-semibold break-all">{created.filename}</strong>.{' '}
            <Link
              href={`/admin/media/${created.id}`}
              className="rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
            >
              View it
            </Link>
          </p>
        )}
      </form>
    </section>
  );
}
