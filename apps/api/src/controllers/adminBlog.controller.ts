import {
  blogCategoryFormSchema,
  blogPostFormSchema,
  blogPostListQuerySchema,
  contentStatusTransitionSchema,
  reorderSchema,
} from '@nexastack/shared';
import type { Request, Response } from 'express';

import { actionContext } from '../lib/actionContext.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';
import * as categories from '../services/blogCategory.service.js';
import * as posts from '../services/blogPost.service.js';

// ---- Posts -------------------------------------------------------------------------------

export async function listPosts(_req: Request, res: Response): Promise<void> {
  const query = validatedQuery(res, blogPostListQuerySchema);
  sendSuccess(res, await posts.listPosts(query), 200);
}

export async function getPost(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(res, { post: await posts.getPostById(id) }, 200);
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, blogPostFormSchema);
  sendSuccess(res, { post: await posts.createPost(input, actionContext(req)) }, 201);
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const input = validatedBody(res, blogPostFormSchema);
  sendSuccess(res, { post: await posts.updatePost(id, input, actionContext(req)) }, 200);
}

export async function changePostStatus(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, contentStatusTransitionSchema);
  sendSuccess(res, { post: await posts.changePostStatus(id, status, actionContext(req)) }, 200);
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  await posts.deletePost(id, actionContext(req));
  sendSuccess(res, { deleted: true }, 200);
}

// ---- Categories --------------------------------------------------------------------------

export async function listCategories(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { categories: await categories.listCategories() }, 200);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, blogCategoryFormSchema);
  sendSuccess(res, { category: await categories.createCategory(input, actionContext(req)) }, 201);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const input = validatedBody(res, blogCategoryFormSchema);
  sendSuccess(
    res,
    { category: await categories.updateCategory(id, input, actionContext(req)) },
    200,
  );
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  await categories.deleteCategory(id, actionContext(req));
  sendSuccess(res, { deleted: true }, 200);
}

export async function reorderCategories(req: Request, res: Response): Promise<void> {
  const { orderedIds } = validatedBody(res, reorderSchema);
  sendSuccess(
    res,
    { categories: await categories.reorderCategories(orderedIds, actionContext(req)) },
    200,
  );
}
