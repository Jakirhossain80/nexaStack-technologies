import { MEDIA_TYPE } from '@nexastack/shared';

import { ValidationError } from './errors.js';

/**
 * Decides what a blog post stores as its cover image. Pure, so the rules can be tested without a
 * database. The caller loads the Media Library record (if `coverMediaId` was sent) and passes it in.
 *
 * TRUST: when a library image is chosen, the stored `coverImage` is taken from the LIBRARY RECORD,
 * never from the request. A client cannot make a post point at an arbitrary address by sending a
 * `coverMediaId` alongside a different URL (the schema also rejects sending both).
 */

export interface CoverInput {
  coverImage?: string | undefined;
  coverMediaId?: string | undefined;
}

/** The parts of a Media Library record a cover decision needs. */
export interface CoverMedia {
  id: string;
  url: string;
  mediaType: string;
  mimeType: string;
}

export interface ResolvedCover {
  coverImage: string | undefined;
  coverMediaId: string | undefined;
}

/** The stored `coverImage` field holds at most this many characters (see the model). */
const COVER_URL_MAX = 200;

function coverIssue(message: string): ValidationError {
  return new ValidationError([{ location: 'body', path: 'coverMediaId', message }]);
}

/**
 * - a library image: must exist, be an image, and be a RASTER image (the public blog renders covers
 *   through `next/image`, which does not serve SVG); the URL comes from the record;
 * - otherwise the legacy site path is kept as given and any library reference is cleared;
 * - neither: no cover.
 */
export function resolveCover(input: CoverInput, media: CoverMedia | null): ResolvedCover {
  if (!input.coverMediaId) {
    return { coverImage: input.coverImage, coverMediaId: undefined };
  }

  if (!media) {
    throw coverIssue('That image is no longer in the Media Library. Please choose another one.');
  }
  if (media.mediaType !== MEDIA_TYPE.IMAGE) {
    throw coverIssue('Only an image can be a cover image. Please choose an image, not a document.');
  }
  if (media.mimeType === 'image/svg+xml') {
    throw coverIssue("An SVG can't be used as a cover image. Please choose a JPG, PNG or WebP.");
  }
  if (media.url.length > COVER_URL_MAX) {
    throw coverIssue('That image address is too long to store. Please choose another image.');
  }

  return { coverImage: media.url, coverMediaId: media.id };
}
