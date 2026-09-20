import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonRegion } from '@/components/ui/SkeletonRegion';

export interface AdminDetailSkeletonProps {
  /** What is loading, read out to screen-reader users, e.g. "Loading the enquiry". */
  label: string;
}

const FIELD_ROWS = 4;

/**
 * Loading state for an admin detail or editor page (one enquiry, quotation, media item or blog
 * post): a back link, heading, a details card and a second block for notes or the editor body.
 */
export function AdminDetailSkeleton({ label }: AdminDetailSkeletonProps) {
  return (
    <SkeletonRegion label={label} className="max-w-3xl">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-6 h-10 w-2/3 md:h-12" />
      <Skeleton className="mt-3 h-5 w-48" />

      <div className="mt-8 space-y-4 rounded-card border border-default bg-surface p-5">
        {Array.from({ length: FIELD_ROWS }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full max-w-sm" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 h-32 w-full rounded-card" />
    </SkeletonRegion>
  );
}
