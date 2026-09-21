import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issuesByPath, parseValid } from '../test-utils/issues.js';

import {
  BLOG_BODY_MAX,
  BLOG_BODY_MIN,
  BLOG_EXCERPT_MAX,
  BLOG_EXCERPT_MIN,
  BLOG_TAGS_MAX,
  BLOG_TAG_MAX_LENGTH,
  BLOG_TITLE_MAX,
  blogCategoryFormSchema,
  blogPostFormSchema,
  blogPostListQuerySchema,
} from './blog.js';

const categoryId = '507f1f77bcf86cd799439011';

const validPost = {
  title: 'A synthetic test post',
  excerpt: 'A synthetic excerpt that is long enough to pass.',
  categoryId,
  tags: ['test'],
  contentMarkdown: 'A synthetic body that is long enough.',
  featured: false,
};

describe('blogPostFormSchema', () => {
  it('accepts a valid post and treats a blank slug as "derive one from the title"', () => {
    const data = parseValid(blogPostFormSchema, { ...validPost, slug: '' });
    assert.equal(data.slug, undefined);
  });

  const rejected: [string, Record<string, unknown>, string, RegExp][] = [
    ['a two-character title', { title: 'Hi' }, 'title', /at least 3 characters/],
    [
      'a title over the maximum',
      { title: 'a'.repeat(BLOG_TITLE_MAX + 1) },
      'title',
      new RegExp(`${BLOG_TITLE_MAX} characters or fewer`),
    ],
    ['an uppercase slug', { slug: 'My-Post' }, 'slug', /lowercase letters/],
    ['a slug with a double hyphen', { slug: 'my--post' }, 'slug', /single hyphens/],
    ['a slug with a path separator', { slug: '../etc/passwd' }, 'slug', /lowercase letters/],
    [
      'a too-short excerpt',
      { excerpt: 'x'.repeat(BLOG_EXCERPT_MIN - 1) },
      'excerpt',
      /at least 20 characters/,
    ],
    [
      'a too-long excerpt',
      { excerpt: 'x'.repeat(BLOG_EXCERPT_MAX + 1) },
      'excerpt',
      /300 characters or fewer/,
    ],
    ['an unselected category', { categoryId: '' }, 'categoryId', /choose a category/],
    ['a non-ObjectId category', { categoryId: 'not-an-id' }, 'categoryId', /valid item/],
    [
      'too many tags',
      { tags: Array.from({ length: BLOG_TAGS_MAX + 1 }, (_, i) => `t${i}`) },
      'tags',
      /8 tags or fewer/,
    ],
    [
      'an over-long tag',
      { tags: ['x'.repeat(BLOG_TAG_MAX_LENGTH + 1)] },
      'tags.0',
      /30 characters or fewer/,
    ],
    ['an empty tag', { tags: [''] }, 'tags.0', /cannot be empty/],
    [
      'a too-short body',
      { contentMarkdown: 'x'.repeat(BLOG_BODY_MIN - 1) },
      'contentMarkdown',
      /at least 20 characters/,
    ],
    [
      'a too-long body',
      { contentMarkdown: 'x'.repeat(BLOG_BODY_MAX + 1) },
      'contentMarkdown',
      /50,000 characters or fewer/,
    ],
    ['a non-boolean featured flag', { featured: 'yes' }, 'featured', /on or off/],
  ];
  for (const [label, override, path, message] of rejected) {
    it(`rejects ${label}`, () => {
      const issues = issuesByPath(blogPostFormSchema, { ...validPost, ...override });
      assert.match(issues[path]?.[0] ?? '', message);
    });
  }

  it('de-duplicates tags case-insensitively, keeping the first spelling', () => {
    const data = parseValid(blogPostFormSchema, {
      ...validPost,
      tags: ['Next.js', 'next.js', 'API', 'api', 'Zod'],
    });
    assert.deepEqual(data.tags, ['Next.js', 'API', 'Zod']);
  });

  describe('cover image (an off-site or scripted value must never be storable)', () => {
    const withCover = (coverImage: string) => ({
      ...validPost,
      coverImage,
      coverImageAlt: 'A test image',
    });

    it('accepts a site-relative image path', () => {
      parseValid(blogPostFormSchema, withCover('/blog/first-post.png'));
      parseValid(blogPostFormSchema, withCover('/blog/nested/photo.WEBP'));
    });

    for (const bad of [
      'https://evil.example/x.png',
      '//evil.example/x.png',
      'javascript:alert(1)',
      '/blog/x.png?x=1',
      '/blog/x.exe',
      '/blog/<script>.png',
      'blog/x.png',
    ]) {
      it(`refuses ${JSON.stringify(bad)}`, () => {
        assert.equal(blogPostFormSchema.safeParse(withCover(bad)).success, false);
      });
    }

    it('requires alt text whenever a cover image is set (path or Media Library)', () => {
      const path = issuesByPath(blogPostFormSchema, { ...validPost, coverImage: '/blog/x.png' });
      assert.match(path['coverImageAlt']?.[0] ?? '', /alt text is required/);
      const media = issuesByPath(blogPostFormSchema, { ...validPost, coverMediaId: categoryId });
      assert.match(media['coverImageAlt']?.[0] ?? '', /alt text is required/);
      parseValid(blogPostFormSchema, {
        ...validPost,
        coverMediaId: categoryId,
        coverImageAlt: 'A test image',
      });
    });

    it('refuses a Media Library id and a site path together', () => {
      const issues = issuesByPath(blogPostFormSchema, {
        ...validPost,
        coverImage: '/blog/x.png',
        coverMediaId: categoryId,
        coverImageAlt: 'A test image',
      });
      assert.match(
        issues['coverMediaId']?.[0] ?? '',
        /either a Media Library image or a site image path/,
      );
    });
  });

  it('has no author, status or html field: a client cannot supply them (unknown keys are dropped)', () => {
    const data = parseValid(blogPostFormSchema, {
      ...validPost,
      author: 'Someone Else',
      status: 'published',
      contentHtml: '<script>alert(1)</script>',
    }) as Record<string, unknown>;
    for (const key of ['author', 'status', 'contentHtml']) assert.equal(key in data, false, key);
  });
});

describe('blogCategoryFormSchema', () => {
  it('accepts a name with an optional slug, refuses a one-character name and a bad slug', () => {
    parseValid(blogCategoryFormSchema, { name: 'Testing' });
    parseValid(blogCategoryFormSchema, { name: 'Testing', slug: 'testing' });
    assert.match(
      issuesByPath(blogCategoryFormSchema, { name: 'T' })['name']?.[0] ?? '',
      /at least 2 characters/,
    );
    assert.ok(
      issuesByPath(blogCategoryFormSchema, { name: 'Testing', slug: 'Not A Slug' })['slug'],
    );
  });
});

describe('blogPostListQuerySchema (the admin list query: pagination, search, status, category)', () => {
  it('applies defaults', () => {
    const data = parseValid(blogPostListQuerySchema, {});
    assert.equal(data.page, 1);
    assert.equal(data.limit, 20);
    assert.equal(data.q, undefined);
    assert.equal(data.status, undefined);
  });

  it('coerces numeric strings and treats blank filters as absent', () => {
    const data = parseValid(blogPostListQuerySchema, {
      page: '3',
      limit: '50',
      q: '  ',
      status: '',
      category: '',
    });
    assert.equal(data.page, 3);
    assert.equal(data.limit, 50);
    assert.equal(data.q, undefined);
    assert.equal(data.status, undefined);
    assert.equal(data.category, undefined);
  });

  it('refuses out-of-range pagination and an unknown status', () => {
    assert.ok(issuesByPath(blogPostListQuerySchema, { page: '0' })['page']);
    assert.ok(issuesByPath(blogPostListQuerySchema, { limit: '101' })['limit']);
    assert.ok(issuesByPath(blogPostListQuerySchema, { page: '1.5' })['page']);
    assert.ok(issuesByPath(blogPostListQuerySchema, { status: 'deleted' })['status']);
  });

  it('refuses NoSQL-operator objects in q, status and category (a query string can nest: ?q[$ne]=x)', () => {
    for (const field of ['q', 'status', 'category']) {
      assert.equal(
        blogPostListQuerySchema.safeParse({ [field]: { $ne: 'x' } }).success,
        false,
        field,
      );
      assert.equal(
        blogPostListQuerySchema.safeParse({ [field]: ['a', 'b'] }).success,
        false,
        `${field} as array`,
      );
    }
  });
});
