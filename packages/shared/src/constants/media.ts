import { z } from 'zod';

/**
 * Media Library (admin): what may be uploaded, and how big. One place, imported by the upload form
 * (so the limits are visible BEFORE a file is chosen) and by the API (which enforces them on the real
 * bytes: the browser's check is convenience, the server is the security boundary).
 *
 * Unrelated to the quotation form's attachment limits (`ATTACHMENT_*`): those are a client's
 * confidential files with their own, stricter policy.
 */

export const MEDIA_TYPE = {
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export const MEDIA_TYPES = [MEDIA_TYPE.IMAGE, MEDIA_TYPE.DOCUMENT] as const;

export const mediaTypeSchema = z.enum(MEDIA_TYPES, {
  error: 'Please choose images or documents',
});

/** Raster images and SVG are "images" (they need alt text); a PDF is a "document" (it gets a description). */
export const MEDIA_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;
export const MEDIA_DOCUMENT_MIME_TYPES = ['application/pdf'] as const;

export type MediaImageMimeType = (typeof MEDIA_IMAGE_MIME_TYPES)[number];
export type MediaDocumentMimeType = (typeof MEDIA_DOCUMENT_MIME_TYPES)[number];
export type MediaMimeType = MediaImageMimeType | MediaDocumentMimeType;

export const MEDIA_ACCEPTED_MIME_TYPES: readonly MediaMimeType[] = [
  ...MEDIA_IMAGE_MIME_TYPES,
  ...MEDIA_DOCUMENT_MIME_TYPES,
];

export const MEDIA_ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'] as const;

/** For `<input type="file" accept>`: a hint to the file picker only. */
export const MEDIA_ACCEPT_ATTRIBUTE = MEDIA_ACCEPTED_EXTENSIONS.join(',');

const MB = 1024 * 1024;

/**
 * Size caps by real file type. Raster images and PDFs: 10 MB (also Cloudinary's free-plan ceiling).
 * SVG is far smaller: a vector icon or logo is a few KB, and a large "SVG" is more likely something
 * else in disguise.
 */
export const MEDIA_RASTER_MAX_BYTES = 10 * MB;
export const MEDIA_SVG_MAX_BYTES = 1 * MB;
export const MEDIA_PDF_MAX_BYTES = 10 * MB;
/** The largest any single upload may be; the request is refused past this before it is read in full. */
export const MEDIA_MAX_UPLOAD_BYTES = Math.max(
  MEDIA_RASTER_MAX_BYTES,
  MEDIA_SVG_MAX_BYTES,
  MEDIA_PDF_MAX_BYTES,
);

export function maxBytesForMime(mimeType: MediaMimeType): number {
  if (mimeType === 'image/svg+xml') return MEDIA_SVG_MAX_BYTES;
  if (mimeType === 'application/pdf') return MEDIA_PDF_MAX_BYTES;
  return MEDIA_RASTER_MAX_BYTES;
}

export function mediaTypeForMime(mimeType: MediaMimeType): MediaType {
  return (MEDIA_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)
    ? MEDIA_TYPE.DOCUMENT
    : MEDIA_TYPE.IMAGE;
}

/**
 * Raster images are stored no larger than this on either side (Cloudinary's `c_limit`): a phone photo
 * or a 6000px export is scaled down once at upload, never enlarged. Formats and quality are chosen
 * per visitor at delivery (`f_auto,q_auto`).
 */
export const MEDIA_MAX_DIMENSION = 2400;

/** Alt text max matches the blog's `coverImageAlt`, so a Media Library alt fits that field later. */
export const MEDIA_ALT_TEXT_MIN = 2;
export const MEDIA_ALT_TEXT_MAX = 200;
export const MEDIA_DESCRIPTION_MAX = 300;
export const MEDIA_FILENAME_MAX = 150;

export const MEDIA_PAGE_SIZE = 24;

/** Shown next to the upload control, before anyone tries and fails. */
export const MEDIA_ALLOWED_TYPES_TEXT =
  'Images: JPG, PNG or WebP up to 10 MB, or SVG up to 1 MB. Documents: PDF up to 10 MB.';
