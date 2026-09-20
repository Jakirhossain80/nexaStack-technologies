import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * One placeholder block for a `loading.tsx` skeleton. Decorative, so it is hidden from assistive
 * technology; the announcement comes from the `SkeletonRegion` around it. The pulse only runs when the
 * visitor has not asked for reduced motion (`motion-safe:`), on top of the global reduced-motion rule.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-field bg-background-alt motion-safe:animate-pulse', className)}
    />
  );
}
