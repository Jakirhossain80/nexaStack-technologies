import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';

/**
 * The generic admin loading state, used at the top of the admin tree. It is what shows while the
 * protected layout checks the session with the API (the layout awaits that before it renders, so a
 * `loading.tsx` inside the protected group cannot cover that wait), and for the dashboard.
 */
export function AdminPageSkeleton() {
  return (
    <SkeletonRegion label="Loading the admin area" className="page-container section-y">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-default pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-full max-w-md" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-10 w-48 md:h-12" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-28 w-full rounded-card" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
