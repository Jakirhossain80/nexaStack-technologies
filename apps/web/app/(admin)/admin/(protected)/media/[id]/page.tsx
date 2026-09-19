import { MEDIA_TYPE, OBJECT_ID_PATTERN } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContentEditorHeader } from '@/components/admin/content/ContentEditorHeader';
import { LoadError } from '@/components/admin/content/LoadError';
import { MediaDeleteDialog } from '@/components/admin/media/MediaDeleteDialog';
import { MediaEditForm } from '@/components/admin/media/MediaEditForm';
import { MediaReplaceForm } from '@/components/admin/media/MediaReplaceForm';
import { MediaThumbnail } from '@/components/admin/media/MediaThumbnail';
import { MediaUrlRow } from '@/components/admin/media/MediaUrlRow';
import { company } from '@/config/company';
import { getMediaDetail, getMediaUsage } from '@/lib/adminMedia.server';
import { can, getAdminSession } from '@/lib/adminSession.server';
import { MEDIA_VARIANTS, withTransformation } from '@/lib/cloudinaryImage';
import { describeMedia } from '@/lib/mediaLabels';

interface MediaDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Media item',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

/** The record's URL comes from our own API, but a link to it is only rendered if it is a Cloudinary address. */
function isCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/');
}

/**
 * One library item: a real preview, its alt text or description, its public URL (with a Copy button
 * and, for a resizable image, ready-made responsive and social-sharing sizes), and the two things
 * that change it: Replace and Delete.
 *
 * What is offered follows the role: editing the alt text or description and replacing the file need
 * `manage:media`, deleting needs `media:delete`. A role with only `media:read` (a content editor) sees
 * the same page read-only. The API refuses each of those changes to anyone without the capability.
 */
export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params;
  if (!OBJECT_ID_PATTERN.test(id)) notFound();

  const admin = await getAdminSession();
  const canManage = can(admin, 'manage:media');
  const canDelete = can(admin, 'media:delete');

  const [result, usageResult] = await Promise.all([getMediaDetail(id), getMediaUsage(id)]);
  if (!result.ok && result.status === 404) notFound();
  if (!result.ok) {
    return <LoadError subject="this file" status={result.status} message={result.message} />;
  }

  const media = result.data;
  // Real references: blog posts that use this image as their cover. If this could not be read the
  // page still works, says so, and the API refuses a delete of a used image regardless.
  const usage = usageResult.ok ? usageResult.data.blogPosts : [];
  const isImage = media.mediaType === MEDIA_TYPE.IMAGE;
  const variants = MEDIA_VARIANTS.flatMap((variant) => {
    const url = withTransformation(media.url, variant.transformation);
    return url ? [{ label: variant.label, url }] : [];
  });

  return (
    <div className="max-w-5xl">
      <ContentEditorHeader
        title={media.filename}
        backHref="/admin/media"
        backLabel="All media"
        badges={
          <span className="inline-flex items-center rounded-full border border-strong bg-surface px-3 py-1 text-label font-medium text-primary">
            {isImage ? 'Image' : 'Document'}
          </span>
        }
        description={
          <>
            Uploaded {formatTimestamp(media.createdAt)}
            {media.uploadedByEmail ? ` by ${media.uploadedByEmail}` : ''}
            {media.replacedAt ? ` · File replaced ${formatTimestamp(media.replacedAt)}` : ''}
          </>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className="text-card font-semibold text-primary">
              Preview
            </h2>
            <div className="mt-3 overflow-hidden rounded-media border border-default">
              <MediaThumbnail media={media} sizes="(min-width: 64rem) 50vw, 100vw" fit="contain" />
            </div>
            <p className="mt-2 text-label text-secondary">{describeMedia(media)}</p>
            {isCloudinaryUrl(media.url) && (
              <p className="mt-2">
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-field text-body text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
                >
                  {isImage ? 'Open the image' : 'Open the document'}
                  <span className="sr-only"> {media.filename} in a new tab</span>
                  <span aria-hidden="true">&nbsp;(new tab)</span>
                </a>
              </p>
            )}
          </section>

          <dl className="mt-6 space-y-3 text-body">
            <div>
              <dt className="text-label text-secondary">Cloudinary ID</dt>
              <dd className="font-mono text-label break-all text-primary">
                {media.cloudinaryPublicId}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-8">
          <section
            aria-labelledby="describe-heading"
            className="rounded-card border border-default bg-surface p-5 sm:p-6"
          >
            <h2 id="describe-heading" className="text-card font-semibold text-primary">
              {isImage ? 'Alt text' : 'Description'}
            </h2>
            <div className="mt-4">
              {canManage ? (
                <MediaEditForm media={media} />
              ) : (
                <>
                  <p className="text-body break-words text-primary">
                    {(isImage ? media.altText : media.description) || 'None written.'}
                  </p>
                  <p className="mt-2 text-label text-secondary">
                    Your role can view this file but not change it.
                  </p>
                </>
              )}
            </div>
          </section>

          <section
            aria-labelledby="url-heading"
            className="rounded-card border border-default bg-surface p-5 sm:p-6"
          >
            <h2 id="url-heading" className="text-card font-semibold text-primary">
              Public URL
            </h2>
            <p className="mt-1 text-label text-secondary">
              Anyone with this address can open the file. Paste it where the file is needed.
            </p>
            <div className="mt-4 space-y-5">
              <MediaUrlRow label="Public URL" url={media.url} />
              {variants.map((variant) => (
                <MediaUrlRow key={variant.label} label={variant.label} url={variant.url} />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="usedby-heading"
            className="rounded-card border border-default bg-surface p-5 sm:p-6"
          >
            <h2 id="usedby-heading" className="text-card font-semibold text-primary">
              Used by
            </h2>
            {!usageResult.ok ? (
              <p role="status" className="mt-2 text-body text-primary">
                Could not check where this is used ({usageResult.message}). Deleting it is still
                blocked if any post uses it.
              </p>
            ) : usage.length === 0 ? (
              <p className="mt-2 text-body text-primary">
                No blog post uses this image as its cover image.
              </p>
            ) : (
              <ul className="mt-3 space-y-1 text-body">
                {usage.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="rounded-field break-words text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
                    >
                      {post.title}
                    </Link>{' '}
                    <span className="text-secondary">(cover image, {post.status})</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-label text-secondary">
              Only blog cover images are tracked, because they store this item&rsquo;s id. An
              address typed into the site&rsquo;s configuration or a page is not; when you delete, a
              best-effort check looks for those.
            </p>
          </section>

          {canManage && (
            <section
              aria-labelledby="replace-heading"
              className="rounded-card border border-default bg-surface p-5 sm:p-6"
            >
              <h2 id="replace-heading" className="text-card font-semibold text-primary">
                Replace
              </h2>
              <div className="mt-2">
                <MediaReplaceForm media={media} />
              </div>
            </section>
          )}

          {canDelete && (
            <section
              aria-labelledby="delete-heading"
              className="rounded-card border border-error bg-surface p-5 sm:p-6"
            >
              <h2 id="delete-heading" className="text-card font-semibold text-primary">
                Delete
              </h2>
              <p className="mt-1 mb-4 text-label text-secondary">
                {usage.length > 0
                  ? 'Blocked while a blog post uses this image as its cover.'
                  : 'Permanent. You will be asked to check where the file might be used and to type its name.'}
              </p>
              <MediaDeleteDialog media={media} usage={usage} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
