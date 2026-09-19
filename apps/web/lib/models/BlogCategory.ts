import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * READ-ONLY mirror of `apps/api/src/models/BlogCategory.ts`. The Express API owns every write
 * (create, rename, reorder, delete); this app only reads, for the public `/blog` filters and the
 * admin preview. Keep the fields and the explicit collection name in step with the API model.
 * Nothing in `apps/web` may write to this collection.
 */
const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true, collection: 'blogcategories' },
);

export type BlogCategoryDocument = InferSchemaType<typeof blogCategorySchema>;

// `models.BlogCategory` is reused across hot reloads in development so Mongoose doesn't throw
// "Cannot overwrite model once compiled".
export const BlogCategory =
  (models.BlogCategory as Model<BlogCategoryDocument> | undefined) ??
  model<BlogCategoryDocument>('BlogCategory', blogCategorySchema);
