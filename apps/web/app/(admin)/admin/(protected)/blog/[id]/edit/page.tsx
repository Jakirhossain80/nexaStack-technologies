import { OBJECT_ID_PATTERN } from '@nexastack/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';
import { ContentEditorHeader } from '@/components/admin/content/ContentEditorHeader';
import { LoadError } from '@/components/admin/content/LoadError';
import { getBlogCategories, getBlogPost } from '@/lib/adminBlog.server';
import { can, getAdminSession } from '@/lib/adminSession.server';

export const metadata: Metadata = {
  title: 'Edit blog post',
};

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  if (!OBJECT_ID_PATTERN.test(id)) notFound();

  const [post, categories, admin] = await Promise.all([
    getBlogPost(id),
    getBlogCategories(),
    getAdminSession(),
  ]);
  if (!post.ok && post.status === 404) notFound();

  if (!post.ok) {
    return <LoadError subject="this post" status={post.status} message={post.message} />;
  }

  return (
    <div>
      <ContentEditorHeader
        title={post.data.title}
        status={post.data.status}
        backHref="/admin/blog"
        backLabel="All posts"
        description={
          post.data.publishedAt
            ? `First published ${new Date(post.data.publishedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}.`
            : 'Never published.'
        }
      />
      <div className="mt-8">
        {categories.ok ? (
          <BlogPostForm
            categories={categories.data}
            post={post.data}
            canPublish={can(admin, 'content:publish')}
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
    </div>
  );
}
