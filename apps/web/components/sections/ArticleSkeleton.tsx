import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';
import { cn } from '@/lib/cn';

const BODY_LINES = ['w-full', 'w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-3/5'];

/**
 * `/blog/[slug]`'s loading state: breadcrumb, headline block, cover-image frame and the article
 * column, in the same two-column arrangement as `ArticleView`.
 */
export function ArticleSkeleton() {
  return (
    <SkeletonRegion label="Loading the article" className="page-container section-y">
      <Skeleton className="h-5 w-56" />

      <div className="mt-8 max-w-prose">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-10 w-full md:h-12" />
        <Skeleton className="mt-3 h-10 w-2/3 md:h-12" />
        <Skeleton className="mt-6 h-5 w-48" />
      </div>

      <Skeleton className="mt-10 aspect-video w-full rounded-media" />

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_16rem]">
        <div className="order-2 max-w-prose space-y-4 lg:order-1">
          {BODY_LINES.map((width, index) => (
            <Skeleton key={index} className={cn('h-4', width)} />
          ))}
        </div>
        <Skeleton className="order-1 h-32 w-full lg:order-2" />
      </div>
    </SkeletonRegion>
  );
}
