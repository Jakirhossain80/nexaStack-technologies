'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface StickyHeaderProps {
  children: ReactNode;
}

/**
 * The sticky <header> element and its scrolled state. Client-side only because it observes
 * scrolling; its children are rendered on the server and passed through.
 *
 * A sentinel at the top of the document is watched with IntersectionObserver rather than a scroll
 * listener, so nothing runs per frame. It must sit outside the sticky header: inside it, it would
 * scroll along with the header and never leave the viewport.
 */
export function StickyHeader({ children }: StickyHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setScrolled(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-2"
      />
      <header
        data-scrolled={scrolled || undefined}
        className="sticky top-0 z-40 border-b border-transparent bg-transparent transition-colors duration-200 ease-out data-scrolled:border-default data-scrolled:bg-background supports-backdrop-filter:data-scrolled:bg-background/85 supports-backdrop-filter:data-scrolled:backdrop-blur-md"
      >
        {children}
      </header>
    </>
  );
}
