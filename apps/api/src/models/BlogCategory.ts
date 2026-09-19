import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * A blog category. `order` is the display order on the public /blog filter and in the admin
 * category manager — a real, gap-free 0..n-1 sequence maintained by blogCategory.service.ts.
 *
 * `apps/web/lib/models/BlogCategory.ts` is a read-only mirror of this schema (the API owns
 * writes). Keep the two — and the explicit collection name — in step.
 */
const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    order: { type: Number, required: true, min: 0, index: true },
  },
  { timestamps: true, collection: 'blogcategories' },
);

export type BlogCategoryDocument = InferSchemaType<typeof blogCategorySchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const BlogCategory =
  (models.BlogCategory as Model<BlogCategoryDocument> | undefined) ??
  model<BlogCategoryDocument>('BlogCategory', blogCategorySchema);
