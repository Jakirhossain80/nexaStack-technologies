import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';

const CARD_COUNT = 6;

/**
 * `/blog`'s loading state: the same page container, heading block, filter row and 3/2/1 card grid as
 * the real page, so nothing jumps when the articles arrive.
 */
export function BlogListSkeleton() {
  return (
    <SkeletonRegion label="Loading articles" className="page-container section-y">
      <Skeleton className="h-5 w-40" />

      <div className="mt-8 max-w-prose">
        <Skeleton className="h-10 w-48 md:h-12" />
        <Skeleton className="mt-4 h-6 w-full max-w-md" />
      </div>

      <div className="mt-12 flex flex-col gap-6 border-y border-default py-6 md:flex-row md:items-end md:justify-between">
        <Skeleton className="h-12 w-full md:max-w-sm" />
        <Skeleton className="h-12 w-full md:max-w-xs" />
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <li
            key={index}
            className="overflow-hidden rounded-card border border-default bg-surface shadow-card"
          >
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}
