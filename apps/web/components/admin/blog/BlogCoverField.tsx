'use client';

import { useRef, useState } from 'react';

import { MediaPickerDialog } from '@/components/admin/blog/MediaPickerDialog';
import { MediaThumbnail } from '@/components/admin/media/MediaThumbnail';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import type { PickerItem } from '@/lib/mediaActions';

export type CoverMode = 'none' | 'library' | 'path';

export interface BlogCoverFieldProps {
  mode: CoverMode;
  /** The chosen library item's id (library mode). */
  mediaId: string;
  /** The chosen library image's address, for the preview. */
  previewUrl: string | undefined;
  /** The post's own alt text, which is what the site will show. */
  previewAlt: string;
  /** The library file's name, when it is known (it is not for a post that was saved earlier). */
  previewName: string | undefined;
  /** An error on the library reference (for example, the image was deleted since it was picked). */
  error: string | undefined;
  onPick: (item: PickerItem) => void;
  onRemove: () => void;
  onUsePath: () => void;
}

const TEXT_BUTTON =
  'inline-flex min-h-11 items-center rounded-field text-body text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover';

/**
 * The cover image chooser: pick from the Media Library, or (for older posts, or an image kept in the
 * site's own `public/` folder) type a site path. It renders only the chooser; the alt text and the path
 * inputs live in the form beside it, because they are ordinary registered fields.
 *
 * Every change is announced through a live region, and focus is placed deliberately, because the button
 * that was just used often disappears (choosing an image swaps "Choose" for "Change"; removing swaps it
 * back), which would otherwise drop keyboard focus onto nothing.
 */
export function BlogCoverField({
  mode,
  mediaId,
  previewUrl,
  previewAlt,
  previewName,
  error,
  onPick,
  onRemove,
  onUsePath,
}: BlogCoverFieldProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pickedRef = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  function handlePick(item: PickerItem) {
    pickedRef.current = true;
    onPick(item);
    setAnnouncement(
      `${item.filename} chosen as the cover image. Its alt text was copied into the alt text field; edit it if this post needs different wording.`,
    );
  }

  // After choosing, the trigger that opened the dialog has been replaced, so Radix has nothing to
  // return focus to: put it on this section's heading instead. After Cancel, the default (back to
  // the trigger) is right.
  function handleCloseAutoFocus(event: Event) {
    if (!pickedRef.current) return;
    pickedRef.current = false;
    event.preventDefault();
    headingRef.current?.focus();
  }

  function handleRemove() {
    onRemove();
    setAnnouncement('Cover image removed.');
    headingRef.current?.focus();
  }

  function handleUsePath() {
    onUsePath();
    setAnnouncement('Type a site image path below.');
    headingRef.current?.focus();
  }

  return (
    <div role="group" aria-labelledby="cover-heading">
      <h3
        id="cover-heading"
        ref={headingRef}
        tabIndex={-1}
        className="rounded-field text-label font-medium text-primary focus-ring"
      >
        Cover image <span className="font-normal text-secondary">(optional)</span>
      </h3>

      {mode === 'library' && previewUrl && (
        <div className="mt-3">
          <div className="overflow-hidden rounded-field border border-default">
            <MediaThumbnail
              media={{
                mediaType: 'image',
                url: previewUrl,
                altText: previewAlt || undefined,
                filename: previewName ?? 'Cover image',
              }}
              sizes="20rem"
            />
          </div>
          <p className="mt-2 text-label text-secondary">
            {previewName ? <span className="break-all text-primary">{previewName}</span> : 'Library image'}
            {' · '}
            <a
              href={`/admin/media/${mediaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
            >
              View in the Media Library
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {mode === 'library' ? (
          <>
            <MediaPickerDialog
              triggerLabel="Change image"
              currentId={mediaId}
              onPick={handlePick}
              onCloseAutoFocus={handleCloseAutoFocus}
            />
            <Button variant="secondary" onClick={handleRemove}>
              Remove cover
            </Button>
          </>
        ) : mode === 'path' ? (
          <>
            <MediaPickerDialog
              triggerLabel="Choose from the Media Library instead"
              onPick={handlePick}
              onCloseAutoFocus={handleCloseAutoFocus}
            />
            <Button variant="secondary" onClick={handleRemove}>
              Remove cover
            </Button>
          </>
        ) : (
          <>
            <MediaPickerDialog
              triggerLabel="Choose from the Media Library"
              onPick={handlePick}
              onCloseAutoFocus={handleCloseAutoFocus}
            />
            <button type="button" onClick={handleUsePath} className={TEXT_BUTTON}>
              Use a site image path instead
            </button>
          </>
        )}
      </div>

      <FieldError id="coverMediaId-error" message={error} />

      {/* Always mounted so a screen reader announces each change as it happens. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
