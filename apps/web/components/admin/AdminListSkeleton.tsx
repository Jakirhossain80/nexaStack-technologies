import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';

export interface AdminListSkeletonProps {
  /** What is loading, read out to screen-reader users, e.g. "Loading enquiries". */
  label: string;
  rows?: number;
}

/**
 * Loading state for an admin list page (enquiries, quotations, media, blog, activity, users):
 * heading, filter bar and a bordered list of rows, matching the real pages' structure. Rendered
 * inside the admin shell, so it has no page container of its own.
 */
export function AdminListSkeleton({ label, rows = 8 }: AdminListSkeletonProps) {
  return (
    <SkeletonRegion label={label}>
      <Skeleton className="h-10 w-56 md:h-12" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <Skeleton className="h-12 w-full md:max-w-sm" />
        <Skeleton className="h-12 w-full md:w-48" />
      </div>

      <ul className="mt-8 divide-y divide-default rounded-card border border-default bg-surface">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 max-w-md" />
              <Skeleton className="h-4 w-1/2 max-w-xs" />
            </div>
            <Skeleton className="h-6 w-24" />
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}
