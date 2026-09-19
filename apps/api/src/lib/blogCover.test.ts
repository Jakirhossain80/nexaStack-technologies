import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { blogPostFormSchema } from '@nexastack/shared';

import { resolveCover, type CoverMedia } from './blogCover.js';

const ID = '507f1f77bcf86cd799439011';
const URL = 'https://res.cloudinary.com/c/image/upload/f_auto,q_auto/v1/nexastack/media/abc123';

const PNG: CoverMedia = { id: ID, url: URL, mediaType: 'image', mimeType: 'image/png' };

/** The field a rejection blames, and its message. */
function rejection(fn: () => unknown): { path: string | undefined; message: string | undefined } {
  try {
    fn();
  } catch (err) {
    const details = (err as { details?: { path: string; message: string }[] }).details;
    return { path: details?.[0]?.path, message: details?.[0]?.message };
  }
  assert.fail('expected a rejection');
}

describe('resolveCover: a library image', () => {
  it('takes the stored URL from the LIBRARY RECORD and records the media id', () => {
    assert.deepEqual(resolveCover({ coverMediaId: ID }, PNG), { coverImage: URL, coverMediaId: ID });
  });

  it('ignores any URL the client sent alongside: it cannot point a post at another address', () => {
    const resolved = resolveCover({ coverMediaId: ID, coverImage: 'https://evil.example/x.png' }, PNG);
    assert.equal(resolved.coverImage, URL);
  });

  it('accepts JPG and WebP too', () => {
    for (const mimeType of ['image/jpeg', 'image/webp']) {
      assert.equal(resolveCover({ coverMediaId: ID }, { ...PNG, mimeType }).coverMediaId, ID);
    }
  });

  it('refuses an image that is not in the library (deleted since it was picked)', () => {
    const r = rejection(() => resolveCover({ coverMediaId: ID }, null));
    assert.equal(r.path, 'coverMediaId');
    assert.match(r.message ?? '', /no longer in the Media Library/);
  });

  it('refuses a document', () => {
    const r = rejection(() =>
      resolveCover({ coverMediaId: ID }, { ...PNG, mediaType: 'document', mimeType: 'application/pdf' }),
    );
    assert.equal(r.path, 'coverMediaId');
    assert.match(r.message ?? '', /Only an image/);
  });

  it('refuses an SVG (the blog renders covers through next/image, which does not serve SVG)', () => {
    const r = rejection(() => resolveCover({ coverMediaId: ID }, { ...PNG, mimeType: 'image/svg+xml' }));
    assert.match(r.message ?? '', /SVG/);
  });

  it('refuses an address longer than the stored field can hold', () => {
    assert.equal(rejection(() => resolveCover({ coverMediaId: ID }, { ...PNG, url: `https://x/${'a'.repeat(200)}` })).path, 'coverMediaId');
  });
});

describe('resolveCover: no library image', () => {
  it('keeps a legacy site path exactly as given and clears any library reference', () => {
    assert.deepEqual(resolveCover({ coverImage: '/blog/first.png' }, null), {
      coverImage: '/blog/first.png',
      coverMediaId: undefined,
    });
  });

  it('no cover at all: both are cleared', () => {
    assert.deepEqual(resolveCover({}, null), { coverImage: undefined, coverMediaId: undefined });
  });
});

describe('blogPostFormSchema: cover rules', () => {
  const BASE = {
    title: 'A perfectly good title',
    excerpt: 'An excerpt that is comfortably longer than twenty characters.',
    categoryId: ID,
    tags: [],
    contentMarkdown: 'A body that is long enough to pass the minimum length rule.',
    featured: false,
  };
  const parse = (extra: Record<string, unknown>) => blogPostFormSchema.safeParse({ ...BASE, ...extra });
  const blames = (extra: Record<string, unknown>): string[] => {
    const result = parse(extra);
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
  };

  it('a post with no cover is valid', () => {
    assert.equal(parse({}).success, true);
  });

  it('a library cover with alt text is valid', () => {
    const result = parse({ coverMediaId: ID, coverImageAlt: 'The team at work' });
    assert.equal(result.success, true);
    assert.equal(result.success && result.data.coverMediaId, ID);
  });

  it('a library cover WITHOUT alt text is rejected, blaming the alt text field', () => {
    assert.deepEqual(blames({ coverMediaId: ID }), ['coverImageAlt']);
    assert.deepEqual(blames({ coverMediaId: ID, coverImageAlt: '   ' }), ['coverImageAlt']);
  });

  it('a legacy site path with alt text is still valid, and without alt text is still rejected', () => {
    assert.equal(parse({ coverImage: '/blog/first.png', coverImageAlt: 'A mark' }).success, true);
    assert.deepEqual(blames({ coverImage: '/blog/first.png' }), ['coverImageAlt']);
  });

  it('sending both a library image and a site path is rejected', () => {
    assert.deepEqual(blames({ coverMediaId: ID, coverImage: '/blog/first.png', coverImageAlt: 'x' }), ['coverMediaId']);
  });

  it('an absolute URL is still not accepted as the typed path (only the library can supply one)', () => {
    assert.ok(blames({ coverImage: 'https://res.cloudinary.com/c/image/upload/x.png', coverImageAlt: 'x' }).includes('coverImage'));
    assert.ok(blames({ coverImage: '//evil.example/x.png', coverImageAlt: 'x' }).includes('coverImage'));
  });

  it('rejects a malformed or object-shaped media id, and treats a blank one as none', () => {
    assert.ok(blames({ coverMediaId: 'not-an-id', coverImageAlt: 'x' }).includes('coverMediaId'));
    assert.ok(blames({ coverMediaId: { $ne: '' }, coverImageAlt: 'x' }).includes('coverMediaId'));
    assert.equal(parse({ coverMediaId: '', coverImage: '', coverImageAlt: '' }).success, true);
  });
});
