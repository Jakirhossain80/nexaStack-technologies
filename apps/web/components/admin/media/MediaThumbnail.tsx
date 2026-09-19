'use client';

import { MEDIA_TYPE, type MediaAdmin } from '@nexastack/shared';
import Image from 'next/image';

import { cn } from '@/lib/cn';
import { cloudinaryImageLoader } from '@/lib/cloudinaryImage';

export interface MediaThumbnailProps {
  media: Pick<MediaAdmin, 'mediaType' | 'url' | 'altText' | 'filename'>;
  /** The `sizes` attribute for the image, so the right width is requested at each breakpoint. */
  sizes: string;
  /** `cover` fills a grid tile; `contain` shows the whole picture (the detail preview). */
  fit?: 'cover' | 'contain';
  className?: string;
}

/**
 * A real preview of an image, or a file-type tile for a document. A Client Component only because
 * `next/image` takes a loader FUNCTION, which cannot be passed from a Server Component.
 *
 * The image's `alt` is the record's real alt text. This is not decoration: it is the content, and it
 * lets the admin check that what they wrote matches what the picture shows. (An image record always
 * has alt text; the filename is only a defensive fallback.) A document tile is decorative, because
 * the file's name is always shown as text next to it.
 */
export function MediaThumbnail({ media, sizes, fit = 'cover', className }: MediaThumbnailProps) {
  if (media.mediaType === MEDIA_TYPE.IMAGE) {
    return (
      <div
        className={cn('relative aspect-video w-full overflow-hidden bg-background-alt', className)}
      >
        <Image
          loader={cloudinaryImageLoader}
          src={media.url}
          alt={media.altText ?? media.filename}
          fill
          sizes={sizes}
          className={fit === 'contain' ? 'object-contain' : 'object-cover'}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex aspect-video w-full flex-col items-center justify-center gap-2 bg-background-alt text-secondary',
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-10"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </svg>
      <span className="text-label font-semibold">PDF</span>
    </div>
  );
}
