import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';

/**
 * Loading state for the admin dashboard, and the fallback for any protected admin page that has no
 * shape of its own. Content only: it renders inside the real admin shell (nav and identity line),
 * which the protected layout has already drawn by the time this shows.
 */
export function AdminDashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading the dashboard">
      <Skeleton className="h-10 w-48 md:h-12" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-card" />
    </SkeletonRegion>
  );
}
