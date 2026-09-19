import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mediaListQuerySchema, mediaUpdateBodySchema } from '../schemas/adminMedia.js';

import { buildMediaFilter } from './mediaQuery.js';

describe('buildMediaFilter', () => {
  it('no filters matches everything', () => {
    assert.deepEqual(buildMediaFilter({}), {});
  });

  it('filters by type', () => {
    assert.deepEqual(buildMediaFilter({ mediaType: 'document' }), { mediaType: 'document' });
  });

  it('searches file name, alt text and description, case-insensitively', () => {
    const filter = buildMediaFilter({ q: 'Team' });
    const clauses = filter.$or as Record<string, RegExp>[];
    assert.deepEqual(
      clauses.map((clause) => Object.keys(clause)[0]),
      ['filename', 'altText', 'description'],
    );
    assert.ok(clauses.every((clause) => Object.values(clause)[0]?.flags === 'i'));
    assert.ok((clauses[0]?.filename as RegExp).test('our-TEAM-photo.png'));
    assert.ok((clauses[1]?.altText as RegExp).test('The whole team on the roof'));
  });

  it('matches the search term literally: metacharacters are escaped, backtracking is inert', () => {
    const pattern = (buildMediaFilter({ q: 'a.b(c)+' }).$or as Record<string, RegExp>[])[0]
      ?.filename as RegExp;
    assert.ok(pattern.test('x a.b(c)+ y'));
    assert.equal(pattern.test('aXb(c)+'), false);

    const evil = (buildMediaFilter({ q: '(a+)+$' }).$or as Record<string, RegExp>[])[0]
      ?.filename as RegExp;
    const started = Date.now();
    evil.test('a'.repeat(40) + '!');
    assert.ok(Date.now() - started < 100);
  });

  it('raster=true means images that are not SVG (what a blog cover can use)', () => {
    const filter = buildMediaFilter({ raster: true });
    assert.equal(filter.mediaType, 'image');
    assert.deepEqual(Object.fromEntries(Object.entries(filter.mimeType as object)), { $ne: 'image/svg+xml' });
  });

  it('raster wins over a conflicting type: it can only ever return raster images', () => {
    assert.equal(buildMediaFilter({ raster: true, mediaType: 'document' }).mediaType, 'image');
  });

  it('raster=false or absent leaves the type and format alone', () => {
    assert.equal('mimeType' in buildMediaFilter({ raster: false }), false);
    assert.equal('mimeType' in buildMediaFilter({}), false);
  });

  it('combines type and search', () => {
    const filter = buildMediaFilter({ q: 'logo', mediaType: 'image' });
    assert.equal(filter.mediaType, 'image');
    assert.ok(filter.$or);
  });
});

describe('mediaListQuerySchema', () => {
  it('defaults to page 1 and 24 per page (a whole number of rows at 2, 3, 4 and 6 columns)', () => {
    const parsed = mediaListQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 24);
    assert.equal(parsed.q, undefined);
    assert.equal(parsed.mediaType, undefined);
  });

  it('accepts a known type and rejects anything else, including an injected object', () => {
    assert.equal(mediaListQuerySchema.parse({ mediaType: 'image' }).mediaType, 'image');
    assert.equal(mediaListQuerySchema.parse({ mediaType: '' }).mediaType, undefined);
    assert.equal(mediaListQuerySchema.safeParse({ mediaType: 'video' }).success, false);
    assert.equal(mediaListQuerySchema.safeParse({ mediaType: { $ne: 'image' } }).success, false);
    assert.equal(mediaListQuerySchema.safeParse({ q: { $ne: '' } }).success, false);
  });

  it('raster defaults to off, and accepts only true or false', () => {
    assert.equal(mediaListQuerySchema.parse({}).raster, false);
    assert.equal(mediaListQuerySchema.parse({ raster: 'true' }).raster, true);
    assert.equal(mediaListQuerySchema.parse({ raster: 'false' }).raster, false);
    assert.equal(mediaListQuerySchema.parse({ raster: '' }).raster, false);
    assert.equal(mediaListQuerySchema.safeParse({ raster: 'yes' }).success, false);
    assert.equal(mediaListQuerySchema.safeParse({ raster: { $ne: 'true' } }).success, false);
  });

  it('trims and bounds the search text and paging', () => {
    assert.equal(mediaListQuerySchema.parse({ q: '  logo ' }).q, 'logo');
    assert.equal(mediaListQuerySchema.safeParse({ q: 'a'.repeat(101) }).success, false);
    assert.equal(mediaListQuerySchema.safeParse({ page: '0' }).success, false);
    assert.equal(mediaListQuerySchema.safeParse({ limit: '101' }).success, false);
  });
});

describe('mediaUpdateBodySchema', () => {
  it('bounds what can arrive; the service applies the per-type rules', () => {
    assert.deepEqual(mediaUpdateBodySchema.parse({ altText: 'x' }), { altText: 'x' });
    assert.equal(mediaUpdateBodySchema.safeParse({ altText: 'a'.repeat(1_001) }).success, false);
    assert.equal(mediaUpdateBodySchema.safeParse({ altText: 5 }).success, false);
  });
});
