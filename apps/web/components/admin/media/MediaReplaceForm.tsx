'use client';

import {
  MEDIA_ACCEPT_ATTRIBUTE,
  MEDIA_ALLOWED_TYPES_TEXT,
  MEDIA_PDF_MAX_BYTES,
  MEDIA_RASTER_MAX_BYTES,
  MEDIA_SVG_MAX_BYTES,
  MEDIA_TYPE,
  type MediaAdmin,
} from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { adminFormRequest } from '@/lib/adminFormRequest';
import { expireBlogCache } from '@/lib/expireBlogCache';
import { formatFileSize } from '@/lib/quotationLabels';

export interface MediaReplaceFormProps {
  media: Pick<MediaAdmin, 'id' | 'mediaType'>;
}

type OldFile = 'kept' | 'deleted' | 'delete-failed';

const OUTCOME_TEXT: Record<OldFile, string> = {
  kept: 'Replaced. The old file was kept in Cloudinary, so any address written directly into a page keeps working.',
  deleted: 'Replaced. The old file was permanently deleted from Cloudinary.',
  'delete-failed':
    'Replaced, but the old file could not be deleted and is still in Cloudinary. You can try again with a later replace.',
};

/** What happened to the blog posts that use this image as their cover. */
function postsSentence(postsUpdated: number | null): string {
  if (postsUpdated === null) {
    return ' The blog posts that use this image could not be updated to the new file, so the old file was kept and they still show it. Replace the file again to retry.';
  }
  if (postsUpdated === 0) return '';
  return ` ${postsUpdated} blog ${postsUpdated === 1 ? 'post that uses' : 'posts that use'} this image as ${postsUpdated === 1 ? 'its' : 'their'} cover now ${postsUpdated === 1 ? 'shows' : 'show'} the new file.`;
}

function maxBytesFor(name: string): number | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.svg')) return MEDIA_SVG_MAX_BYTES;
  if (['.jpg', '.jpeg', '.png', '.webp'].some((ext) => lower.endsWith(ext))) return MEDIA_RASTER_MAX_BYTES;
  if (lower.endsWith('.pdf')) return MEDIA_PDF_MAX_BYTES;
  return null;
}

/**
 * Swap the file behind this item, keeping its id, alt text or description. Says plainly what this
 * does and does NOT do: only records that reference the library item follow the new file, while a
 * URL written directly into a page still points at the old one, which is why the old file is KEPT
 * unless the admin explicitly ticks the box to remove it.
 */
export function MediaReplaceForm({ media }: MediaReplaceFormProps) {
  const router = useRouter();
  const inputId = useId();
  const rulesId = useId();
  const checkboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deleteOld, setDeleteOld] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const kindWord = media.mediaType === MEDIA_TYPE.IMAGE ? 'image' : 'document';

  function choose(picked: File | null) {
    setMessage(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const max = maxBytesFor(picked.name);
    if (max === null) {
      setFile(null);
      setFileError(`“${picked.name}” isn't an accepted type. ${MEDIA_ALLOWED_TYPES_TEXT}`);
    } else if (picked.size === 0) {
      setFile(null);
      setFileError(`“${picked.name}” is empty. Please choose another file.`);
    } else if (picked.size > max) {
      setFile(null);
      setFileError(`“${picked.name}” is ${formatFileSize(picked.size)}, over the ${formatFileSize(max)} limit for this type.`);
    } else {
      setFile(picked);
      setFileError(null);
    }
  }

  async function replace() {
    // `aria-disabled` (below), not `disabled`, while saving: a button that becomes `disabled` loses
    // keyboard focus, so activation is ignored here instead.
    if (pending) return;
    if (!file) {
      setFileError('Please choose the new file first.');
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    setMessage(null);

    const body = new FormData();
    body.append('file', file);
    if (deleteOld) body.append('deleteOld', 'true');

    const result = await adminFormRequest<{
      media: MediaAdmin;
      oldFile: OldFile;
      postsUpdated: number | null;
    }>(
      'POST',
      `/api/v1/admin/media/${media.id}/replace`,
      body,
    );
    setPending(false);

    if (!result.ok) {
      const forFile = result.error.details?.find((detail) => detail.path === 'file');
      if (forFile) setFileError(forFile.message);
      else setMessage({ kind: 'error', text: result.error.message });
      return;
    }

    // Replacing a file repoints the blog posts that use it as their cover, so the public blog's cache
    // is now out of date (best-effort; only when posts were actually repointed).
    if ((result.data.postsUpdated ?? 0) > 0) await expireBlogCache();

    setMessage({
      kind: 'success',
      text: `${OUTCOME_TEXT[result.data.oldFile]}${postsSentence(result.data.postsUpdated)}`,
    });
    setFile(null);
    setFileError(null);
    setDeleteOld(false);
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  return (
    <div>
      <h3 className="text-body font-semibold text-primary">Replace the file</h3>
      <p className="mt-1 text-label text-secondary">
        Keeps this item&rsquo;s address in the library and its {media.mediaType === MEDIA_TYPE.IMAGE ? 'alt text' : 'description'}.
        {kindWord === 'image' ? 'An image' : 'A document'} can only be replaced by another {kindWord}.
      </p>
      <p className="mt-2 text-label text-secondary">
        <strong className="font-semibold text-primary">What this changes:</strong> blog posts that use
        this image as their cover image switch to the new file. A web address written directly into a
        page, a configuration file or post text still points at the old file.
      </p>

      <div className="mt-4">
        <label htmlFor={inputId} className="block text-label font-medium text-primary">
          New file <span className="font-normal text-secondary">(required)</span>
        </label>
        <p id={rulesId} className="mt-1 text-label text-secondary">
          {MEDIA_ALLOWED_TYPES_TEXT}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          aria-describedby={rulesId}
          aria-invalid={fileError ? true : undefined}
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
          className="mt-2 block min-h-11 w-full rounded-field border border-strong bg-surface p-2 text-body text-primary focus-ring file:mr-3 file:min-h-9 file:rounded-field file:border file:border-default file:bg-surface file:px-3 file:text-label file:font-medium file:text-primary"
        />
        {fileError && (
          <p role="alert" className="mt-2 text-label text-error">
            {fileError}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Checkbox
          id={checkboxId}
          checked={deleteOld}
          onChange={(event) => setDeleteOld(event.target.checked)}
        />
        <label htmlFor={checkboxId} className="text-body text-primary">
          Also permanently delete the old file from Cloudinary
          <span className="block text-label text-secondary">
            Off by default. Turn it on only if the old file was wrong or should not stay public: any
            address that points straight at it will stop working. This cannot be undone.
          </span>
        </label>
      </div>

      <Button
        variant="secondary"
        className="mt-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        aria-disabled={pending || undefined}
        onClick={() => void replace()}
      >
        {pending ? 'Replacing…' : 'Replace file'}
      </Button>

      {/* Always mounted so a screen reader announces the outcome when it appears. */}
      <p
        role={message?.kind === 'error' ? 'alert' : 'status'}
        className={
          message?.kind === 'error'
            ? 'mt-3 text-body text-error'
            : message
              ? 'mt-3 text-body text-primary'
              : 'sr-only'
        }
      >
        {message?.text}
      </p>
    </div>
  );
}
