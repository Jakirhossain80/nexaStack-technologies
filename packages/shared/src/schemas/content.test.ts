import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issuesByPath, parseValid } from '../test-utils/issues.js';

import {
  contentListQuerySchema,
  contentStatusTransitionSchema,
  emptyToUndefined,
  objectIdSchema,
  paginationQuerySchema,
  reorderSchema,
  slugSchema,
} from './content.js';

const idA = '507f1f77bcf86cd799439011';
const idB = '507f1f77bcf86cd799439012';

describe('emptyToUndefined', () => {
  it('maps blank and whitespace-only strings to undefined and leaves everything else alone', () => {
    assert.equal(emptyToUndefined(''), undefined);
    assert.equal(emptyToUndefined('   '), undefined);
    assert.equal(emptyToUndefined('x'), 'x');
    assert.equal(emptyToUndefined(0), 0);
    assert.equal(emptyToUndefined(null), null);
  });
});

describe('objectIdSchema and slugSchema', () => {
  it('objectIdSchema accepts 24 hex characters of either case and nothing else', () => {
    parseValid(objectIdSchema, idA);
    parseValid(objectIdSchema, idA.toUpperCase());
    for (const bad of [
      '',
      'xyz',
      idA.slice(1),
      `${idA}0`,
      'g'.repeat(24),
      { $ne: null },
      12345,
      `${idA}\n`,
    ]) {
      assert.equal(objectIdSchema.safeParse(bad).success, false, JSON.stringify(bad));
    }
  });

  it('slugSchema accepts lowercase words joined by single hyphens', () => {
    for (const ok of ['a', 'my-post', 'post-2', '2026-review']) parseValid(slugSchema, ok);
    for (const bad of [
      '',
      'My-Post',
      '-lead',
      'trail-',
      'a--b',
      'a b',
      'a_b',
      'a/b',
      'é',
      'a'.repeat(101),
    ]) {
      assert.equal(slugSchema.safeParse(bad).success, false, JSON.stringify(bad));
    }
  });
});

describe('contentStatusTransitionSchema', () => {
  it('accepts the four real statuses and refuses anything else', () => {
    for (const status of ['draft', 'published', 'unpublished', 'archived']) {
      parseValid(contentStatusTransitionSchema, { status });
    }
    assert.match(
      issuesByPath(contentStatusTransitionSchema, { status: 'scheduled' })['status']?.[0] ?? '',
      /valid status/,
    );
    assert.equal(contentStatusTransitionSchema.safeParse({}).success, false);
  });
});

describe('reorderSchema', () => {
  it('accepts a list of distinct ids', () => {
    parseValid(reorderSchema, { orderedIds: [idA, idB] });
  });

  it('refuses an empty list, duplicates, a non-id and more than 200 ids', () => {
    assert.match(
      issuesByPath(reorderSchema, { orderedIds: [] })['orderedIds']?.[0] ?? '',
      /at least one id/,
    );
    assert.match(
      issuesByPath(reorderSchema, { orderedIds: [idA, idA] })['orderedIds']?.[0] ?? '',
      /only once/,
    );
    assert.ok(issuesByPath(reorderSchema, { orderedIds: ['nope'] })['orderedIds.0']);
    const many = Array.from({ length: 201 }, (_, i) => i.toString(16).padStart(24, '0'));
    assert.match(
      issuesByPath(reorderSchema, { orderedIds: many })['orderedIds']?.[0] ?? '',
      /Too many/,
    );
  });
});

describe('paginationQuerySchema and contentListQuerySchema', () => {
  it('default to page 1, limit 20', () => {
    assert.deepEqual(parseValid(paginationQuerySchema, {}), { page: 1, limit: 20 });
  });

  it('coerce query-string numbers but refuse fractional, zero, negative and oversized values', () => {
    assert.deepEqual(parseValid(paginationQuerySchema, { page: '2', limit: '100' }), {
      page: 2,
      limit: 100,
    });
    for (const bad of [
      { page: '0' },
      { page: '-1' },
      { page: '1.5' },
      { page: 'abc' },
      { limit: '0' },
      { limit: '101' },
    ]) {
      assert.equal(paginationQuerySchema.safeParse(bad).success, false, JSON.stringify(bad));
    }
  });

  it('contentListQuerySchema caps search text at 100 characters and validates status', () => {
    parseValid(contentListQuerySchema, { q: 'a'.repeat(100), status: 'published' });
    assert.match(
      issuesByPath(contentListQuerySchema, { q: 'a'.repeat(101) })['q']?.[0] ?? '',
      /100 characters or fewer/,
    );
    assert.ok(issuesByPath(contentListQuerySchema, { status: 'nope' })['status']);
  });
});
