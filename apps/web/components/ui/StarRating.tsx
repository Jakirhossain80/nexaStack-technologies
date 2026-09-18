import { cn } from '@/lib/cn';

export interface StarRatingProps {
  rating: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

const STAR_INDEXES = [1, 2, 3, 4, 5] as const;

function FilledStar() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-primary-blue">
      <path d="M10 1.5l2.53 5.13 5.66.82-4.1 4 .97 5.63L10 14.5l-5.06 2.58.97-5.63-4.1-4 5.66-.82L10 1.5Z" />
    </svg>
  );
}

function EmptyStar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="size-4 text-secondary"
    >
      <path d="M10 1.5l2.53 5.13 5.66.82-4.1 4 .97 5.63L10 14.5l-5.06 2.58.97-5.63-4.1-4 5.66-.82L10 1.5Z" />
    </svg>
  );
}

/**
 * A five-star rating, token colors only (no invented gold hex): filled stars are solid
 * `text-primary-blue`, empty stars are outlined `text-secondary` — the fill-vs-outline shape
 * difference carries the meaning, not color alone (root CLAUDE.md 14). The real accessible name
 * comes from the wrapping `role="img"` label, not from reading 5 separate icons — each glyph is
 * `aria-hidden`. Renders nothing when there's no rating; never defaults or shows empty-star
 * placeholders implying a rating that wasn't actually given.
 */
export function StarRating({ rating, className }: StarRatingProps) {
  return (
    <div
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className={cn('flex items-center gap-0.5', className)}
    >
      {STAR_INDEXES.map((index) => (index <= rating ? <FilledStar key={index} /> : <EmptyStar key={index} />))}
    </div>
  );
}
