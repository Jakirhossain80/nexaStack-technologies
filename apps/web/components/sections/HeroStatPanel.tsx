import { cn } from '@/lib/cn';

const checkIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-0.5 size-4 shrink-0 text-primary-blue"
  >
    <path d="M4 10.5l3.5 3.5L16 5.5" />
  </svg>
);

export interface HeroStatPanelProps {
  stats: readonly string[];
  className?: string;
}

/**
 * The one hero statistic panel permitted the restrained glass treatment (root CLAUDE.md 8).
 * Solid by default; the translucent + blurred surface only applies where `backdrop-filter` is
 * supported, mirroring `StickyHeader`'s fallback so the opaque case always meets contrast.
 */
export function HeroStatPanel({ stats, className }: HeroStatPanelProps) {
  return (
    <ul
      className={cn(
        'space-y-3 rounded-card border border-default bg-surface p-5 shadow-card supports-backdrop-filter:bg-surface/85 supports-backdrop-filter:backdrop-blur-md',
        className,
      )}
    >
      {stats.map((stat) => (
        <li key={stat} className="flex items-start gap-3 text-body text-primary">
          {checkIcon}
          <span>{stat}</span>
        </li>
      ))}
    </ul>
  );
}
