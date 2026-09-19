import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONTENT_STATUS, CONTENT_STATUSES, type ContentStatus } from '@nexastack/shared';

import { ConflictError } from '../lib/errors.js';
import { applyStatusTransition, type StatusBearing } from './contentStatus.js';

const NOW = new Date('2026-09-19T10:00:00.000Z');
const EARLIER = new Date('2026-01-01T00:00:00.000Z');

const ALLOWED: readonly [ContentStatus, ContentStatus][] = [
  ['draft', 'published'],
  ['draft', 'archived'],
  ['published', 'unpublished'],
  ['published', 'archived'],
  ['unpublished', 'published'],
  ['unpublished', 'archived'],
  ['archived', 'draft'],
];

describe('applyStatusTransition', () => {
  it('allows exactly the seven workflow transitions and rejects every other pair', () => {
    for (const from of CONTENT_STATUSES) {
      for (const to of CONTENT_STATUSES) {
        const doc: StatusBearing = { status: from, publishedAt: null };
        const expected = ALLOWED.some(([f, t]) => f === from && t === to);

        if (expected) {
          assert.doesNotThrow(() => applyStatusTransition(doc, to, NOW), `${from} → ${to}`);
          assert.equal(doc.status, to);
        } else {
          assert.throws(
            () => applyStatusTransition(doc, to, NOW),
            ConflictError,
            `${from} → ${to}`,
          );
          assert.equal(doc.status, from, 'a rejected change must not mutate the document');
        }
      }
    }
  });

  it('reports the change made', () => {
    const doc: StatusBearing = { status: CONTENT_STATUS.DRAFT, publishedAt: null };
    assert.deepEqual(applyStatusTransition(doc, CONTENT_STATUS.PUBLISHED, NOW), {
      from: 'draft',
      to: 'published',
    });
  });

  it('sets publishedAt on the first publish', () => {
    const doc: StatusBearing = { status: CONTENT_STATUS.DRAFT, publishedAt: null };
    applyStatusTransition(doc, CONTENT_STATUS.PUBLISHED, NOW);
    assert.equal(doc.publishedAt, NOW);
  });

  it('does not set publishedAt for any transition other than publishing', () => {
    const doc: StatusBearing = { status: CONTENT_STATUS.DRAFT, publishedAt: null };
    applyStatusTransition(doc, CONTENT_STATUS.ARCHIVED, NOW);
    assert.equal(doc.publishedAt, null);
    applyStatusTransition(doc, CONTENT_STATUS.DRAFT, NOW);
    assert.equal(doc.publishedAt, null);
  });

  it('keeps the original publishedAt when an unpublished post is published again', () => {
    const doc: StatusBearing = { status: CONTENT_STATUS.UNPUBLISHED, publishedAt: EARLIER };
    applyStatusTransition(doc, CONTENT_STATUS.PUBLISHED, NOW);
    assert.equal(
      doc.publishedAt,
      EARLIER,
      're-publishing must not overwrite the first publish date',
    );
  });

  it('keeps publishedAt through unpublish, archive and restore', () => {
    const doc: StatusBearing = { status: CONTENT_STATUS.PUBLISHED, publishedAt: EARLIER };
    applyStatusTransition(doc, CONTENT_STATUS.UNPUBLISHED, NOW);
    applyStatusTransition(doc, CONTENT_STATUS.ARCHIVED, NOW);
    applyStatusTransition(doc, CONTENT_STATUS.DRAFT, NOW);
    assert.equal(doc.publishedAt, EARLIER);

    // A restored draft that was live before is published again with its original date.
    applyStatusTransition(doc, CONTENT_STATUS.PUBLISHED, NOW);
    assert.equal(doc.publishedAt, EARLIER);
  });
});
