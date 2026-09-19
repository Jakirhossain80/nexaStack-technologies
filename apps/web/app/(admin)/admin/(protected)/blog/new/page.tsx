import type { Metadata } from 'next';

import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';
import { ContentEditorHeader } from '@/components/admin/content/ContentEditorHeader';
import { LoadError } from '@/components/admin/content/LoadError';
import { getBlogCategories } from '@/lib/adminBlog.server';

export const metadata: Metadata = {
  title: 'New blog post',
};

export default async function NewBlogPostPage() {
  const categories = await getBlogCategories();

  return (
    <div>
      <ContentEditorHeader
        title="New post"
        backHref="/admin/blog"
        backLabel="All posts"
        description="A new post is saved as a draft. Nothing is public until you publish it."
      />
      <div className="mt-8">
        {categories.ok ? (
          <BlogPostForm categories={categories.data} />
        ) : (
          <LoadError
            subject="the categories"
            status={categories.status}
            message={categories.message}
          />
        )}
      </div>
    </div>
  );
}
