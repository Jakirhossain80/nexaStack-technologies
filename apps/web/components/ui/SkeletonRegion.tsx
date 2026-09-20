import type { ReactNode } from 'react';

export interface SkeletonRegionProps {
  /** What is loading, read out to screen-reader users. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a skeleton so it is announced once as a busy status ("Loading the blog") instead of being
 * silent, while the placeholder blocks inside stay hidden from assistive technology.
 */
export function SkeletonRegion({ label, children, className }: SkeletonRegionProps) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
