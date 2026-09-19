import type { BlogCategoryAdmin, BlogCategoryInput } from '@nexastack/shared';
import mongoose from 'mongoose';

import { ConflictError, NotFoundError } from '../lib/errors.js';
import { findFreeSlug, slugify } from '../lib/slug.js';
import { BlogCategory } from '../models/BlogCategory.js';
import { BlogPost } from '../models/BlogPost.js';
import { type AdminActionContext, logAdminAction } from './adminActivityLog.service.js';

/** MongoDB's duplicate-key error code — a unique-index race the pre-check cannot fully prevent. */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

async function countPostsByCategory(): Promise<Map<string, number>> {
  const rows = await BlogPost.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

function toAdminCategory(
  doc: { _id: unknown; name: string; slug: string; order: number },
  postCount: number,
): BlogCategoryAdmin {
  return { id: String(doc._id), name: doc.name, slug: doc.slug, order: doc.order, postCount };
}

/** Every category in display order, with how many posts (any status) use it. */
export async function listCategories(): Promise<BlogCategoryAdmin[]> {
  const [docs, counts] = await Promise.all([
    BlogCategory.find().sort({ order: 1, name: 1 }).lean(),
    countPostsByCategory(),
  ]);
  return docs.map((doc) => toAdminCategory(doc, counts.get(String(doc._id)) ?? 0));
}

export async function createCategory(
  input: BlogCategoryInput,
  context: AdminActionContext,
): Promise<BlogCategoryAdmin> {
  let slug: string;
  if (input.slug) {
    if (await BlogCategory.exists({ slug: input.slug })) {
      throw new ConflictError(`A category with the URL slug "${input.slug}" already exists.`);
    }
    slug = input.slug;
  } else {
    slug = await findFreeSlug(slugify(input.name, 'category'), async (candidate) =>
      Boolean(await BlogCategory.exists({ slug: candidate })),
    );
  }

  const last = await BlogCategory.findOne().sort({ order: -1 }).select('order').lean();
  const order = last ? last.order + 1 : 0;

  let created;
  try {
    created = await BlogCategory.create({ name: input.name, slug, order });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ConflictError(`A category with the URL slug "${slug}" already exists.`);
    }
    throw err;
  }

  await logAdminAction(context, 'blog_category_created', {
    categoryId: created.id as string,
    slug,
  });
  return toAdminCategory(created, 0);
}

export async function updateCategory(
  id: string,
  input: BlogCategoryInput,
  context: AdminActionContext,
): Promise<BlogCategoryAdmin> {
  const category = await BlogCategory.findById(id);
  if (!category) throw new NotFoundError('That category was not found. It may have been deleted.');

  if (input.slug && input.slug !== category.slug) {
    // `trusted`: the project sets `sanitizeFilter`, which would otherwise wrap this `$ne` in `$eq`.
    // The operand is a database-issued ObjectId, never user input.
    if (
      await BlogCategory.exists({ slug: input.slug, _id: mongoose.trusted({ $ne: category._id }) })
    ) {
      throw new ConflictError(`A category with the URL slug "${input.slug}" already exists.`);
    }
    category.slug = input.slug;
  }
  category.name = input.name;

  try {
    await category.save();
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ConflictError(`A category with the URL slug "${category.slug}" already exists.`);
    }
    throw err;
  }

  const postCount = await BlogPost.countDocuments({ category: category._id });
  await logAdminAction(context, 'blog_category_updated', {
    categoryId: id,
    slug: category.slug,
  });
  return toAdminCategory(category, postCount);
}

/** Refused while any post (in any status) still uses the category — the posts would be orphaned. */
export async function deleteCategory(id: string, context: AdminActionContext): Promise<void> {
  const category = await BlogCategory.findById(id).lean();
  if (!category) throw new NotFoundError('That category was not found. It may have been deleted.');

  const postCount = await BlogPost.countDocuments({ category: category._id });
  if (postCount > 0) {
    throw new ConflictError(
      `This category is used by ${postCount} ${postCount === 1 ? 'post' : 'posts'}. Move ${
        postCount === 1 ? 'it' : 'them'
      } to another category first.`,
    );
  }

  await BlogCategory.deleteOne({ _id: category._id });

  // Keep `order` a gap-free 0..n-1 sequence.
  const remaining = await BlogCategory.find().sort({ order: 1 }).select('_id').lean();
  await BlogCategory.bulkWrite(
    remaining.map((doc, index) => ({
      updateOne: { filter: { _id: doc._id }, update: { $set: { order: index } } },
    })),
  );

  await logAdminAction(context, 'blog_category_deleted', { categoryId: id, slug: category.slug });
}

/**
 * Persist a new display order. `orderedIds` must be exactly the current set of categories: if it
 * is not (someone added or deleted one since the page loaded) that is a 409, and nothing is
 * changed, so a stale screen can never silently scramble the order.
 */
export async function reorderCategories(
  orderedIds: string[],
  context: AdminActionContext,
): Promise<BlogCategoryAdmin[]> {
  const existing = await BlogCategory.find().select('_id').lean();
  const existingIds = new Set(existing.map((doc) => String(doc._id)));

  const sameSet =
    existingIds.size === orderedIds.length && orderedIds.every((id) => existingIds.has(id));
  if (!sameSet) {
    throw new ConflictError('The category list has changed. Reload the page and try again.');
  }

  await BlogCategory.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    })),
  );

  await logAdminAction(context, 'blog_category_reordered', { orderedIds });
  return listCategories();
}
