import { MEDIA_TYPE, mediaTypeSchema } from '@nexastack/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentListFilters } from '@/components/admin/content/ContentListFilters';
import { LoadError } from '@/components/admin/content/LoadError';
import { MediaThumbnail } from '@/components/admin/media/MediaThumbnail';
import { MediaUploadForm } from '@/components/admin/media/MediaUploadForm';
import { Pagination } from '@/components/ui/Pagination';
import { getMediaList } from '@/lib/adminMedia.server';
import { describeMedia } from '@/lib/mediaLabels';

export const metadata: Metadata = {
  title: 'Media Library',
};

interface MediaPageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string; deleted?: string }>;
}

const TYPE_FILTER = {
  paramName: 'type',
  label: 'Type',
  allLabel: 'All files',
  options: [
    { value: MEDIA_TYPE.IMAGE, label: 'Images' },
    { value: MEDIA_TYPE.DOCUMENT, label: 'Documents' },
  ],
};

/**
 * The Media Library: upload, then browse. Search and the type filter are URL search params applied by
 * the API in the database query (root CLAUDE.md 12); the grid never filters a fetched list itself.
 * Every tile shows the file's name as real text (a document is not just an icon), and an image tile
 * shows the image with its own alt text.
 */
export default async function MediaPage({ searchParams }: MediaPageProps) {
  const params = await searchParams;

  // The URL is untrusted: keep only well-formed values so a junk link shows an ordinary list rather
  // than an API validation error. The API re-validates everything regardless.
  const q = params.q?.trim().slice(0, 100) || undefined;
  const parsedType = mediaTypeSchema.safeParse(params.type);
  const type = parsedType.success ? parsedType.data : undefined;
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const deleted = params.deleted?.slice(0, 150) || undefined;

  const result = await getMediaList({ q, type, page });
  const isFiltered = Boolean(q || type);

  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">Media Library</h1>
      <p className="mt-2 text-body text-secondary">
        Images and documents for the public website. Files here are public: anyone with the address
        can open them.
      </p>

      {deleted && (
        <p role="status" className="mt-6 rounded-field border border-default bg-surface px-4 py-3 text-body text-primary">
          Deleted &ldquo;{deleted}&rdquo; from the library and from Cloudinary.
        </p>
      )}

      <div className="mt-8">
        <MediaUploadForm />
      </div>

      <ContentListFilters
        searchLabel="Search media"
        searchPlaceholder="File name, alt text or description"
        statusFilter={TYPE_FILTER}
      />

      {!result.ok ? (
        <LoadError subject="the media library" status={result.status} message={result.message} />
      ) : result.data.items.length === 0 ? (
        <p className="mt-8 text-body text-secondary">
          {isFiltered ? 'No files match your search or filter.' : 'No files yet. Upload the first one above.'}
        </p>
      ) : (
        <>
          <p className="mt-8 text-label text-secondary" role="status">
            Showing {result.data.items.length} of {result.data.total}{' '}
            {result.data.total === 1 ? 'file' : 'files'}
          </p>
          <ul aria-label="Media files" className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {result.data.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/media/${item.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-card border border-default bg-surface transition duration-150 ease-out hover:border-default-hover hover:bg-surface-hover focus-ring"
                >
                  <MediaThumbnail
                    media={item}
                    sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                  />
                  <span className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-2 font-medium break-words text-primary">
                      {item.filename}
                    </span>
                    <span className="text-label text-secondary">{describeMedia(item)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            basePath="/admin/media"
            currentPage={result.data.page}
            totalPages={result.data.totalPages}
            currentParams={{ q, type }}
          />
        </>
      )}
    </div>
  );
}
