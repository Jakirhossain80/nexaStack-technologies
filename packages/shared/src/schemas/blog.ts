import { z } from 'zod';

import { contentListQuerySchema, emptyToUndefined, objectIdSchema, slugSchema } from './content.js';

/**
 * Blog posts and categories. Used by the admin editor forms (React Hook Form resolver) and by
 * `apps/api`'s `/api/v1/admin/blog/*` routes — the security boundary; client validation is
 * convenience only (root CLAUDE.md section 10).
 *
 * The author is deliberately not a field: the byline is the founder, from `company.ts`.
 */

export const BLOG_TITLE_MAX = 120;
export const BLOG_EXCERPT_MIN = 20;
export const BLOG_EXCERPT_MAX = 300;
export const BLOG_BODY_MIN = 20;
export const BLOG_BODY_MAX = 50_000;
export const BLOG_TAGS_MAX = 8;
export const BLOG_TAG_MAX_LENGTH = 30;

/** An optional slug: blank means "derive one from the title". */
const optionalSlugSchema = z.preprocess(emptyToUndefined, slugSchema.optional());

const tagSchema = z
  .string({ error: 'Each tag must be text' })
  .trim()
  .min(1, { error: 'Tags cannot be empty' })
  .max(BLOG_TAG_MAX_LENGTH, {
    error: `Each tag must be ${BLOG_TAG_MAX_LENGTH} characters or fewer`,
  });

/**
 * A cover image comes from the Media Library (`coverMediaId`: the API then sets `coverImage` from the
 * library record, never from the client), or, for older posts and images kept in the site's own
 * `public/` folder, is a site-relative PATH (for example `/blog/first-post.png`). This pattern is that
 * legacy path form. It rejects `//host/…` (protocol-relative) and any scheme, so the value can never
 * point off-site or carry `javascript:`.
 */
const COVER_IMAGE_PATTERN = /^\/(?!\/)[A-Za-z0-9/_\-.]+\.(?:png|jpe?g|webp|avif|gif|svg)$/i;

export const blogPostFormSchema = z
  .object({
    title: z
      .string({ error: 'Please enter a title' })
      .trim()
      .min(3, { error: 'Please enter a title of at least 3 characters' })
      .max(BLOG_TITLE_MAX, {
        error: `Please use a title of ${BLOG_TITLE_MAX} characters or fewer`,
      }),
    slug: optionalSlugSchema,
    excerpt: z
      .string({ error: 'Please enter an excerpt' })
      .trim()
      .min(BLOG_EXCERPT_MIN, {
        error: `Please write an excerpt of at least ${BLOG_EXCERPT_MIN} characters`,
      })
      .max(BLOG_EXCERPT_MAX, {
        error: `Please keep the excerpt to ${BLOG_EXCERPT_MAX} characters or fewer`,
      }),
    // An unselected <select> sends '' — say "choose a category" rather than "invalid item".
    categoryId: z
      .string({ error: 'Please choose a category' })
      .min(1, { error: 'Please choose a category' })
      .pipe(objectIdSchema),
    tags: z
      .array(tagSchema, { error: 'Tags must be a list of words' })
      .max(BLOG_TAGS_MAX, { error: `Please use ${BLOG_TAGS_MAX} tags or fewer` })
      .transform((tags) => {
        // Case-insensitive de-duplication, keeping the first spelling.
        const seen = new Set<string>();
        return tags.filter((tag) => {
          const key = tag.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }),
    coverImage: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(200, { error: 'Please use an image path of 200 characters or fewer' })
        .regex(COVER_IMAGE_PATTERN, {
          error:
            'Use a site image path such as /blog/my-post.png (starts with one slash, ends in .png, .jpg, .webp, .avif, .gif or .svg)',
        })
        .optional(),
    ),
    // A Media Library item. Blank means "no library image". The API loads the record and sets the
    // stored `coverImage` from it, so a form never supplies (or spoofs) the URL of a library image.
    coverMediaId: z.preprocess(emptyToUndefined, objectIdSchema.optional()),
    coverImageAlt: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(200, { error: 'Please use alt text of 200 characters or fewer' })
        .optional(),
    ),
    contentMarkdown: z
      .string({ error: 'Please write the post body' })
      .trim()
      .min(BLOG_BODY_MIN, { error: `Please write a body of at least ${BLOG_BODY_MIN} characters` })
      .max(BLOG_BODY_MAX, {
        error: `Please keep the body to ${BLOG_BODY_MAX.toLocaleString('en-US')} characters or fewer`,
      }),
    featured: z.boolean({ error: 'Featured must be on or off' }),
  })
  .refine((post) => !(post.coverImage && post.coverMediaId), {
    error: 'Choose either a Media Library image or a site image path, not both',
    path: ['coverMediaId'],
  })
  .refine((post) => !(post.coverImage || post.coverMediaId) || Boolean(post.coverImageAlt), {
    error: 'Please describe the cover image: alt text is required when a cover image is set',
    path: ['coverImageAlt'],
  });

export const blogCategoryFormSchema = z.object({
  name: z
    .string({ error: 'Please enter a category name' })
    .trim()
    .min(2, { error: 'Please enter a name of at least 2 characters' })
    .max(60, { error: 'Please use a name of 60 characters or fewer' }),
  slug: optionalSlugSchema,
});

/** `GET /api/v1/admin/blog/posts` — search, status and category filters, pagination. */
export const blogPostListQuerySchema = contentListQuerySchema.extend({
  category: z.preprocess(emptyToUndefined, slugSchema.optional()),
});
