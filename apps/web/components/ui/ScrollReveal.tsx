'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fades and rises its children once, the moment they scroll into view (root CLAUDE.md 7.6).
 * Client-only because viewport-entry is only observable in the browser; children are rendered
 * on the server and passed through unchanged, same pattern as `StickyHeader`.
 *
 * Progressive enhancement: content is visible by default. Only after mount does it "arm" itself
 * (hidden, offset) and start observing, so a page with JS disabled or not yet hydrated never
 * loses this content — it just skips the animation.
 */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setArmed(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-armed={armed || undefined}
      data-visible={visible || undefined}
      className={cn('scroll-reveal', className)}
    >
      {children}
    </div>
  );
}
