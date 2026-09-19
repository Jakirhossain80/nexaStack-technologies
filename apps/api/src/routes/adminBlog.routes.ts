import {
  blogCategoryFormSchema,
  blogPostFormSchema,
  blogPostListQuerySchema,
  contentStatusTransitionSchema,
  reorderSchema,
} from '@nexastack/shared';
import { Router } from 'express';

import * as controller from '../controllers/adminBlog.controller.js';
import { csrfProtection } from '../middleware/csrf.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';

/**
 * Blog CMS endpoints, mounted at `/api/v1/admin/blog`.
 *
 * Mounted BEFORE `adminRouter` in routes/index.ts: `adminRouter` applies a router-wide
 * `requireRole('super_admin', 'admin')`, which would lock out `content_editor` — the role
 * apps/api/CLAUDE.md section 5 defines as "blog and portfolio content only". This router carries
 * its own explicit role list instead.
 *
 * Every mutation also passes `csrfProtection` (exact Origin + custom header). Reads do not need
 * it. No rate limiter, consistent with the other session-gated admin routes (apps/api/CLAUDE.md
 * section 8 reserves rate limiting for public and auth endpoints).
 */
export const adminBlogRouter = Router();

adminBlogRouter.use(requireSession, requireRole('super_admin', 'admin', 'content_editor'));

const idParams = { params: mongoIdParamSchema };

// ---- Posts -------------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/admin/blog/posts:
 *   get:
 *     summary: Search, filter and paginate blog posts
 *     description: >
 *       Query parameters `q` (title/excerpt substring), `status`, `category` (slug), `page`,
 *       `limit`. With no `status`, archived posts are hidden. Filtering happens in the database.
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: "A page of posts: { items, page, limit, total, totalPages }." }
 *       400: { description: Invalid query (VALIDATION_ERROR). }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Role not permitted (FORBIDDEN). }
 *   post:
 *     summary: Create a blog post (always as a draft)
 *     tags: [Admin Blog]
 *     responses:
 *       201: { description: The created post. }
 *       400: { description: Invalid body (VALIDATION_ERROR). }
 *       409: { description: Duplicate slug (CONFLICT). }
 */
adminBlogRouter.get('/posts', validate({ query: blogPostListQuerySchema }), controller.listPosts);
adminBlogRouter.post(
  '/posts',
  csrfProtection,
  validate({ body: blogPostFormSchema }),
  controller.createPost,
);

/**
 * @openapi
 * /api/v1/admin/blog/posts/{id}:
 *   get:
 *     summary: One blog post in any status (editor and preview data source)
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: The post, including markdown source and rendered HTML. }
 *       404: { description: Not found (NOT_FOUND). }
 *   patch:
 *     summary: Edit a post's content fields (never its status)
 *     description: >
 *       Archived posts must be restored first. The slug is locked once the post has been
 *       published.
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: The updated post. }
 *       400: { description: Invalid body (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Slug locked/duplicate, or post archived (CONFLICT). }
 *   delete:
 *     summary: Delete a draft or archived post
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: Deleted. }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Post is published or unpublished (CONFLICT). }
 */
adminBlogRouter.get('/posts/:id', validate(idParams), controller.getPost);
adminBlogRouter.patch(
  '/posts/:id',
  csrfProtection,
  validate({ ...idParams, body: blogPostFormSchema }),
  controller.updatePost,
);
adminBlogRouter.delete('/posts/:id', csrfProtection, validate(idParams), controller.deletePost);

/**
 * @openapi
 * /api/v1/admin/blog/posts/{id}/status:
 *   post:
 *     summary: Change a post's status (publish, unpublish, archive, restore)
 *     description: >
 *       Body `{ status }`. Allowed changes: draft to published/archived; published to
 *       unpublished/archived; unpublished to published/archived; archived to draft.
 *       `publishedAt` is set on the first publish only.
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: The updated post. }
 *       400: { description: Invalid status value (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Change not allowed from the current status (CONFLICT). }
 */
adminBlogRouter.post(
  '/posts/:id/status',
  csrfProtection,
  validate({ ...idParams, body: contentStatusTransitionSchema }),
  controller.changePostStatus,
);

// ---- Categories --------------------------------------------------------------------------

/**
 * @openapi
 * /api/v1/admin/blog/categories:
 *   get:
 *     summary: All categories in display order, with post counts
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: "{ categories }." }
 *   post:
 *     summary: Create a category (appended to the end of the order)
 *     tags: [Admin Blog]
 *     responses:
 *       201: { description: The created category. }
 *       400: { description: Invalid body (VALIDATION_ERROR). }
 *       409: { description: Duplicate slug (CONFLICT). }
 */
adminBlogRouter.get('/categories', controller.listCategories);
adminBlogRouter.post(
  '/categories',
  csrfProtection,
  validate({ body: blogCategoryFormSchema }),
  controller.createCategory,
);

/**
 * @openapi
 * /api/v1/admin/blog/categories/order:
 *   put:
 *     summary: Set the category display order
 *     description: >
 *       Body `{ orderedIds }` must list every existing category exactly once; otherwise 409 and
 *       nothing changes.
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: "The reordered categories." }
 *       400: { description: Invalid body (VALIDATION_ERROR). }
 *       409: { description: The list changed since it was loaded (CONFLICT). }
 */
adminBlogRouter.put(
  '/categories/order',
  csrfProtection,
  validate({ body: reorderSchema }),
  controller.reorderCategories,
);

/**
 * @openapi
 * /api/v1/admin/blog/categories/{id}:
 *   patch:
 *     summary: Rename a category (or change its slug)
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: The updated category. }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Duplicate slug (CONFLICT). }
 *   delete:
 *     summary: Delete an unused category
 *     tags: [Admin Blog]
 *     responses:
 *       200: { description: Deleted. }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Category still has posts (CONFLICT). }
 */
adminBlogRouter.patch(
  '/categories/:id',
  csrfProtection,
  validate({ ...idParams, body: blogCategoryFormSchema }),
  controller.updateCategory,
);
adminBlogRouter.delete(
  '/categories/:id',
  csrfProtection,
  validate(idParams),
  controller.deleteCategory,
);
