import type { HeroTechnologies } from '@/config/content/home';
import { cn } from '@/lib/cn';

import { HeroStatPanel } from './HeroStatPanel';
import { HeroTechSummary } from './HeroTechSummary';

export interface HeroVisualProps {
  stats: readonly string[];
  technologies: HeroTechnologies;
  className?: string;
}

/** Placeholder text line in the wireframe, tinted so it reads on a translucent pane. */
function Line({ className }: { className?: string }) {
  return <div className={cn('h-2 rounded-field bg-primary-blue/15', className)} />;
}

/** Translucent inner tile. Only used inside the decorative artwork, never for real content. */
const GLASS_TILE = 'rounded-card border border-default/70 bg-surface/50';

/**
 * PLACEHOLDER: glassmorphism artwork standing in for a real project screenshot, which doesn't
 * exist yet (no portfolio built — root CLAUDE.md 22.10). Replace the artwork block once real
 * project imagery is available; the two floating panels are real content and stay.
 *
 * Glass is permitted here as a "selected decorative element" (root CLAUDE.md 8): the whole
 * artwork is `aria-hidden` and holds no content. Three blurred brand-colour shapes sit behind a
 * frosted browser window so the blur has something to refract. They are dimmed in dark mode to
 * keep glow minimal. Without `backdrop-filter` support the window falls back to a solid surface.
 * Static, no animation. The URL bar shows no domain, since none is registered yet (22.1).
 *
 * Mobile/tablet: the panels stack below the artwork in normal flow, and the small decorative
 * tile is hidden. Desktop (`lg`): panels float over the corners. The parent section's
 * `overflow-hidden` clips the blurred shapes, so nothing scrolls horizontally.
 */
export function HeroVisual({ stats, technologies, className }: HeroVisualProps) {
  return (
    <div className={cn('relative', className)}>
      <div aria-hidden="true" className="relative isolate">
        {/* Colour field behind the glass: hero artwork gradient use (CLAUDE.md 7.2). */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-8 -left-6 size-48 rounded-full bg-cyan opacity-50 blur-3xl sm:size-64 dark:opacity-25" />
          <div className="absolute top-1/3 -right-8 size-56 rounded-full bg-primary-blue opacity-40 blur-3xl sm:size-72 dark:opacity-25" />
          <div className="absolute -bottom-10 left-1/4 size-52 rounded-full bg-violet opacity-40 blur-3xl sm:size-64 dark:opacity-25" />
        </div>

        {/* Frosted browser window */}
        <div className="relative overflow-hidden rounded-media border border-default bg-surface shadow-card-hover supports-backdrop-filter:bg-surface/40 supports-backdrop-filter:backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 glass-sheen" />

          {/* Browser chrome */}
          <div className="relative flex items-center gap-4 border-b border-default/70 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-cyan" />
              <span className="size-2.5 rounded-full bg-primary-blue" />
              <span className="size-2.5 rounded-full bg-violet" />
            </div>
            <div className="flex h-6 flex-1 items-center gap-2 rounded-field border border-default/70 bg-surface/50 px-2.5">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-3 shrink-0 text-secondary"
              >
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
              </svg>
              <Line className="w-2/5" />
            </div>
          </div>

          {/* Dashboard wireframe */}
          <div className="relative flex gap-4 p-4 sm:gap-5 sm:p-5">
            {/* Sidebar */}
            <div className={cn(GLASS_TILE, 'hidden w-1/4 shrink-0 space-y-3 p-3 sm:block')}>
              <div className="h-3 w-3/4 rounded-field bg-linear-to-r from-cyan via-primary-blue to-violet opacity-80" />
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 rounded-field bg-primary-blue/15 px-2 py-1.5">
                  <span className="size-2 rounded-full bg-primary-blue" />
                  <div className="h-1.5 flex-1 rounded-field bg-primary-blue/40" />
                </div>
                {['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'].map((width) => (
                  <div key={width} className="flex items-center gap-2 px-2 py-1.5">
                    <span className="size-2 rounded-full bg-primary-blue/25" />
                    <Line className={cn('h-1.5', width)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              {/* KPI tiles */}
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ['from-cyan', 'to-primary-blue'],
                    ['from-primary-blue', 'to-violet'],
                    ['from-violet', 'to-primary-blue'],
                  ] as const
                ).map(([from, to]) => (
                  <div key={from} className={cn(GLASS_TILE, 'p-3')}>
                    <div
                      className={cn('size-5 rounded-field bg-linear-to-br opacity-90', from, to)}
                    />
                    <div className="mt-3 h-2.5 w-3/5 rounded-field bg-primary-blue/30" />
                    <Line className="mt-1.5 h-1.5 w-4/5" />
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className={cn(GLASS_TILE, 'p-4')}>
                <div className="flex items-center justify-between">
                  <Line className="w-20" />
                  <div className="flex gap-1.5">
                    <span className="h-2 w-6 rounded-field bg-primary-blue/40" />
                    <span className="h-2 w-6 rounded-field bg-primary-blue/15" />
                  </div>
                </div>
                <svg viewBox="0 0 300 96" preserveAspectRatio="none" className="mt-3 h-24 w-full">
                  <defs>
                    <linearGradient id="hero-chart-stroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--nx-cyan)" />
                      <stop offset="50%" stopColor="var(--nx-primary-blue)" />
                      <stop offset="100%" stopColor="var(--nx-violet)" />
                    </linearGradient>
                    <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--nx-primary-blue)" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="var(--nx-primary-blue)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 78 C30 72 45 54 75 56 S120 70 150 46 S205 40 230 28 S275 18 300 8 L300 96 L0 96 Z"
                    fill="url(#hero-chart-fill)"
                  />
                  <path
                    d="M0 78 C30 72 45 54 75 56 S120 70 150 46 S205 40 230 28 S275 18 300 8"
                    fill="none"
                    stroke="url(#hero-chart-stroke)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              {/* Bar rows */}
              <div className="grid grid-cols-2 gap-3">
                {['w-3/4', 'w-1/2'].map((width) => (
                  <div key={width} className={cn(GLASS_TILE, 'space-y-2 p-3')}>
                    <Line className="w-1/2" />
                    <div className="h-1.5 rounded-field bg-primary-blue/15">
                      <div
                        className={cn(
                          'h-full rounded-field bg-linear-to-r from-cyan via-primary-blue to-violet',
                          width,
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Small floating glass tile with a gradient ring. Decorative, desktop only. */}
        <div className="absolute -right-6 bottom-16 hidden size-20 items-center justify-center rounded-card border border-default bg-surface shadow-card-hover supports-backdrop-filter:bg-surface/50 supports-backdrop-filter:backdrop-blur-xl lg:flex">
          <svg viewBox="0 0 48 48" className="size-12">
            <defs>
              <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--nx-cyan)" />
                <stop offset="50%" stopColor="var(--nx-primary-blue)" />
                <stop offset="100%" stopColor="var(--nx-violet)" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="19" fill="none" stroke="var(--nx-border)" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="19"
              fill="none"
              stroke="url(#hero-ring)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="95 120"
              transform="rotate(-90 24 24)"
            />
            <path
              d="M17 24.5l4.5 4.5L31 19.5"
              fill="none"
              stroke="var(--nx-primary-blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:block">
        <HeroStatPanel stats={stats} className="lg:absolute lg:-bottom-8 lg:-left-8 lg:max-w-xs" />
        <HeroTechSummary
          label={technologies.label}
          items={technologies.items}
          className="lg:absolute lg:-top-6 lg:-right-4 lg:max-w-60"
        />
      </div>
    </div>
  );
}
