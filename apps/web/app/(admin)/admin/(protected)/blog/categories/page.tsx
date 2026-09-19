import type { Metadata } from 'next';

import { BlogAdminNav } from '@/components/admin/blog/BlogAdminNav';
import { BlogCategoryCreateForm } from '@/components/admin/blog/BlogCategoryCreateForm';
import { BlogCategoryManager } from '@/components/admin/blog/BlogCategoryManager';
import { LoadError } from '@/components/admin/content/LoadError';
import { getBlogCategories } from '@/lib/adminBlog.server';
import { can, getAdminSession } from '@/lib/adminSession.server';

export const metadata: Metadata = {
  title: 'Blog categories',
};

export default async function BlogCategoriesPage() {
  const [categories, admin] = await Promise.all([getBlogCategories(), getAdminSession()]);

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Blog categories</h1>
      <p className="mt-2 text-body text-secondary">
        The order here is the order of the category filter on the public blog. A category appears
        there once it has at least one published post.
      </p>

      <div className="mt-6">
        <BlogAdminNav current="categories" />
      </div>

      <div className="mt-8">
        <BlogCategoryCreateForm />
      </div>

      {categories.ok ? (
        <BlogCategoryManager
          categories={categories.data}
          canRearrange={can(admin, 'content:publish')}
          canDelete={can(admin, 'content:delete')}
        />
      ) : (
        <LoadError
          subject="the categories"
          status={categories.status}
          message={categories.message}
        />
      )}
    </div>
  );
}
