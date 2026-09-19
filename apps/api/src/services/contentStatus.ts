import { canTransition, type ContentStatus, CONTENT_STATUS } from '@nexastack/shared';

import { ConflictError } from '../lib/errors.js';

/**
 * Status-transition logic shared by every full-CMS content type. Works on any document with a
 * `status` and a `publishedAt`, so the next content type reuses it unchanged.
 */

export interface StatusBearing {
  status: string;
  publishedAt?: Date | null;
}

export interface StatusChange {
  from: ContentStatus;
  to: ContentStatus;
}

/**
 * Move `doc` to `next` if the workflow allows it, mutating `doc` (the caller saves it).
 *
 * `publishedAt` is set on the FIRST transition to `published` and never afterwards: it is not
 * set while a draft, and an unpublished post that goes live again keeps its original date.
 *
 * @throws ConflictError (409) for a change `CONTENT_STATUS_TRANSITIONS` does not allow.
 */
export function applyStatusTransition(
  doc: StatusBearing,
  next: ContentStatus,
  now: Date = new Date(),
): StatusChange {
  const from = doc.status as ContentStatus;

  if (!canTransition(from, next)) {
    throw new ConflictError(`This item is ${from}, so it can't be changed to ${next}.`);
  }

  doc.status = next;
  if (next === CONTENT_STATUS.PUBLISHED && !doc.publishedAt) {
    doc.publishedAt = now;
  }

  return { from, to: next };
}
