'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/Button';
import type { Testimonial } from '@/config/testimonials';

import { TestimonialCard } from './TestimonialCard';

export interface TestimonialCarouselProps {
  testimonials: readonly Testimonial[];
}

const AUTOPLAY_INTERVAL_MS = 4000;

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-5',
} as const;

const CHEVRON_LEFT = (
  <svg {...ICON_PROPS}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg {...ICON_PROPS}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const PAUSE_ICON = (
  <svg {...ICON_PROPS}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);

const PLAY_ICON = (
  <svg {...ICON_PROPS}>
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </svg>
);

/** One card's width plus the track's gap, read from the DOM so it stays correct across breakpoints. */
function getStepWidth(track: HTMLUListElement): number {
  const firstItem = track.firstElementChild;
  if (!(firstItem instanceof HTMLElement)) return track.clientWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap || '0');
  return firstItem.offsetWidth + (Number.isNaN(gap) ? 0 : gap);
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Reads the live `prefers-reduced-motion` preference via `useSyncExternalStore` rather than
 * `useEffect` + `setState`: it's the React-recommended way to read external browser state that
 * may differ between server and client without a synchronous setState-in-effect (which
 * `react-hooks/set-state-in-effect` flags) and without a hydration mismatch — React reconciles
 * the real value itself right after hydration.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Homepage testimonials carousel: a native horizontally-scrollable, scroll-snapped list
 * with an attached auto-scroll behaviour, not a one-slide-at-a-time WAI-ARIA carousel —
 * several cards are visible at once here, so plain `<ul>`/`<li>` semantics plus explicit
 * prev/next and pause/play controls are more correct (and far less noisy for screen
 * readers) than slide-N-of-M live-region announcements.
 *
 * Autoplay is driven by `scrollTo`/`scrollBy` on the real scroll container rather than a
 * CSS transform animation, so autoplay, manual drag/swipe/scrollbar use, and the prev/next
 * buttons all read and write the same `scrollLeft` — one source of truth, nothing to
 * reconcile.
 *
 * `prefers-reduced-motion` can't be handled once, globally, in CSS here (see
 * `globals.css`'s media query): that rule only neutralises CSS transitions/animations and
 * `scroll-behavior`, not JS directly driving `scrollLeft` on an interval, so this component
 * checks `matchMedia` itself and simply never starts autoplay when the user has asked for
 * reduced motion. Manual prev/next stays available either way.
 */
export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const suspendedRef = useRef(false);
  const [userPaused, setUserPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isPlaying = userPaused === false && prefersReducedMotion === false;

  useEffect(() => {
    if (!isPlaying) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || suspendedRef.current) return;

      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      track.scrollTo({
        left: atEnd ? 0 : track.scrollLeft + getStepWidth(track),
        behavior: 'smooth',
      });
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isPlaying]);

  const pauseTemporarily = useCallback(() => {
    suspendedRef.current = true;
  }, []);

  const resumeTemporarily = useCallback(() => {
    suspendedRef.current = false;
  }, []);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * getStepWidth(track), behavior: 'smooth' });
  }, []);

  const togglePlay = useCallback(() => setUserPaused((paused) => !paused), []);

  if (testimonials.length === 0) return null;

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
        onMouseEnter={pauseTemporarily}
        onMouseLeave={resumeTemporarily}
        onFocusCapture={pauseTemporarily}
        onBlurCapture={resumeTemporarily}
      >
        {testimonials.map((testimonial) => (
          <li key={testimonial.id} className="flex w-72 shrink-0 snap-start sm:w-80 lg:w-96">
            <TestimonialCard testimonial={testimonial} />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          aria-label="Previous testimonial"
          className="size-12 px-0"
          onClick={() => scrollByStep(-1)}
        >
          {CHEVRON_LEFT}
        </Button>
        <Button
          variant="secondary"
          aria-label={isPlaying ? 'Pause testimonials autoplay' : 'Play testimonials autoplay'}
          className="size-12 px-0"
          onClick={togglePlay}
        >
          {isPlaying ? PAUSE_ICON : PLAY_ICON}
        </Button>
        <Button
          variant="secondary"
          aria-label="Next testimonial"
          className="size-12 px-0"
          onClick={() => scrollByStep(1)}
        >
          {CHEVRON_RIGHT}
        </Button>
      </div>
    </div>
  );
}
