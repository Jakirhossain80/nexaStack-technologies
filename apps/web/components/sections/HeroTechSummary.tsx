import { cn } from '@/lib/cn';

export interface HeroTechSummaryProps {
  label: string;
  items: readonly string[];
  className?: string;
}

/**
 * The floating technology summary beside the hero mockup, one of the four places glass is
 * permitted (root CLAUDE.md 8). Same recipe as `HeroStatPanel`: solid surface by default,
 * translucent + blurred only where `backdrop-filter` is supported, so the fallback always meets
 * contrast. Real content, not decorative, so it stays in the accessibility tree.
 */
export function HeroTechSummary({ label, items, className }: HeroTechSummaryProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-default bg-surface p-4 shadow-card supports-backdrop-filter:bg-surface/85 supports-backdrop-filter:backdrop-blur-md',
        className,
      )}
    >
      <p className="text-label font-medium text-secondary">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-field border border-default bg-background-alt px-2 py-0.5 font-mono text-label text-primary"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
