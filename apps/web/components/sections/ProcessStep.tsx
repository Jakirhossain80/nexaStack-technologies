import Link from 'next/link';

import type { ProcessStep as ProcessStepData } from '@/config/process';
import { cn } from '@/lib/cn';

export interface ProcessStepProps {
  step: ProcessStepData;
  /** Desktop side (≥1024px) the content column sits on relative to the centre line. */
  side: 'left' | 'right';
  /** Display position, 1-indexed — used only for the decorative badge text. */
  position: number;
  /**
   * The heading level of the step title. `h3` by default: on the homepage the steps sit under a section
   * `h2`. On `/process` the steps ARE the page's sections (h1, then the steps), so it passes `h2`.
   */
  titleAs?: 'h2' | 'h3';
}

const INLINE_LINK_CLASSES =
  'rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover';

/**
 * One step in the homepage process timeline. DOM order is always step order (1..8) — only the
 * `side` prop changes which desktop grid column the content lands in via explicit
 * `col-start` placement, never the `order` property, so visual alternation never desyncs from
 * reading order (root CLAUDE.md 9.1 caution, same technique `SolutionsIndustries` uses for
 * per-index column spans).
 *
 * The badge fill is deliberately solid `bg-primary-blue` + `text-on-primary` — the one pairing
 * root CLAUDE.md 7.1 pre-verifies and says to always use together — with the permitted brand
 * gradient expressed only as a thin ring around it, never behind or through the number text
 * itself: the gradient's cyan stop is ~2.3:1 against white, and CLAUDE.md 7.1 already rules
 * cyan out as a text colour, so neither "gradient background" nor "gradient text" for the
 * number is safe as a literal full fill.
 */
export function ProcessStep({ step, side, position, titleAs: Title = 'h3' }: ProcessStepProps) {
  const inlineLink = step.inlineLink;
  const isRight = side === 'right';

  return (
    <li className="relative grid grid-cols-[2.5rem_1fr] items-start gap-x-5 lg:grid-cols-[1fr_2.5rem_1fr] lg:gap-x-10">
      <div
        aria-hidden="true"
        className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan via-primary-blue to-violet p-1 lg:col-start-2"
      >
        <span className="flex size-full items-center justify-center rounded-full bg-primary-blue text-label font-semibold text-on-primary">
          {String(position).padStart(2, '0')}
        </span>
      </div>

      <div className={cn(isRight ? 'lg:col-start-3 lg:text-left' : 'lg:col-start-1 lg:text-right')}>
        <Title className="text-card font-semibold text-primary">{step.title}</Title>
        <p className="mt-2 text-body text-secondary">
          {inlineLink
            ? step.description.split(inlineLink.text).map((part, index, parts) => (
                <span key={index}>
                  {part}
                  {index < parts.length - 1 && (
                    <Link href={inlineLink.href} className={INLINE_LINK_CLASSES}>
                      {inlineLink.text}
                    </Link>
                  )}
                </span>
              ))
            : step.description}
        </p>
      </div>
    </li>
  );
}
