import { contentStatusSchema } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { BlogAdminNav } from '@/components/admin/blog/BlogAdminNav';
import { ContentListFilters } from '@/components/admin/content/ContentListFilters';
import { LoadError } from '@/components/admin/content/LoadError';
import { StatusBadge } from '@/components/admin/content/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { company } from '@/config/company';
import { getBlogCategories, getBlogPosts } from '@/lib/adminBlog.server';

export const metadata: Metadata = {
  title: 'Blog posts',
};

interface BlogAdminPageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

export default async function BlogAdminPage({ searchParams }: BlogAdminPageProps) {
  const params = await searchParams;

  // The URL is untrusted. Keep only well-formed values so a junk link shows an ordinary list
  // instead of an API validation error; the API re-validates everything regardless.
  const q = params.q?.trim().slice(0, 100) || undefined;
  const parsedStatus = contentStatusSchema.safeParse(params.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const category =
    params.category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.category)
      ? params.category
      : undefined;
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const [postsResult, categoriesResult] = await Promise.all([
    getBlogPosts({ q, status, category, page }),
    getBlogCategories(),
  ]);

  const categoryOptions = categoriesResult.ok
    ? categoriesResult.data.map((item) => ({ value: item.slug, label: item.name }))
    : [];
  const isFiltered = Boolean(q || status || category);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-semibold tracking-tight text-primary">Blog posts</h1>
          <p className="mt-2 text-body text-secondary">
            Write, preview and publish articles. Only published posts appear on the public blog.
          </p>
        </div>
        <Button href="/admin/blog/new">New post</Button>
      </div>

      <div className="mt-6">
        <BlogAdminNav current="posts" />
      </div>

      <ContentListFilters
        searchLabel="Search posts"
        searchPlaceholder="Search by title or excerpt"
        extraFilters={[
          {
            paramName: 'category',
            label: 'Category',
            allLabel: 'All categories',
            options: categoryOptions,
          },
        ]}
      />

      {!postsResult.ok ? (
        <LoadError
          subject="the blog posts"
          status={postsResult.status}
          message={postsResult.message}
        />
      ) : postsResult.data.items.length === 0 ? (
        <p className="mt-8 text-body text-secondary">
          {isFiltered
            ? 'No posts match your search or filters.'
            : 'No posts yet. Create the first one.'}
        </p>
      ) : (
        <>
          <p className="mt-8 text-label text-secondary" role="status">
            Showing {postsResult.data.items.length} of {postsResult.data.total}{' '}
            {postsResult.data.total === 1 ? 'post' : 'posts'}
            {status ? '' : ' (archived posts are hidden; filter by Archived to see them)'}
          </p>
          <ul
            aria-label="Blog posts"
            className="mt-3 divide-y divide-default rounded-card border border-default bg-surface"
          >
            {postsResult.data.items.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="flex flex-col gap-3 px-4 py-4 text-body focus-ring transition duration-150 ease-out hover:bg-surface-hover md:flex-row md:items-center md:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-primary">{post.title}</span>
                    <span className="block font-mono text-label break-all text-secondary">
                      /blog/{post.slug}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-label text-secondary">
                      {post.category?.name ?? 'No category'}
                    </span>
                    <StatusBadge status={post.status} />
                    <span className="text-label text-secondary">
                      Updated {formatTimestamp(post.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            basePath="/admin/blog"
            currentPage={postsResult.data.page}
            totalPages={postsResult.data.totalPages}
            currentParams={{ q, status, category }}
          />
        </>
      )}
    </div>
  );
}
