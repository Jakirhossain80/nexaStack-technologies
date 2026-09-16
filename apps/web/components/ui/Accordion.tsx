'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

/** Root: pass `type="multiple"` or `type="single"` at the call site. */
export const Accordion = AccordionPrimitive.Root;

export type AccordionItemProps = ComponentProps<typeof AccordionPrimitive.Item>;

/** A bordered row (root CLAUDE.md 8: Flat Design 2.0, no shadow, no card shell). */
export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return <AccordionPrimitive.Item className={cn('border-b border-default', className)} {...props} />;
}

export type AccordionTriggerProps = ComponentProps<typeof AccordionPrimitive.Trigger>;

/**
 * `AccordionPrimitive.Header` renders an `<h3>` by default, and `Trigger` wires
 * `aria-expanded`/`aria-controls` automatically — the WAI-ARIA accordion pattern without
 * hand-rolling it (apps/web CLAUDE.md 11). The chevron reads the trigger's own `data-state`
 * via `group-data-[state=open]`, since it's a child of the element that carries the attribute.
 */
export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          'group flex min-h-12 w-full items-center justify-between gap-4 py-5 text-left text-card font-semibold text-primary focus-ring',
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-secondary transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export type AccordionContentProps = ComponentProps<typeof AccordionPrimitive.Content>;

/**
 * `AccordionPrimitive.Content` sets `role="region"` and `aria-labelledby` automatically, and is
 * only in the accessibility tree's reading flow while open. `overflow-hidden` plus the
 * `accordion-down`/`accordion-up` keyframes (styles/globals.css) animate the Radix-measured
 * height; the inner wrapper carries padding so it doesn't fight that height animation.
 */
export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        'overflow-hidden text-body text-secondary state-open:animate-accordion-down state-closed:animate-accordion-up',
        className,
      )}
      {...props}
    >
      <div className="pr-9 pb-5">{children}</div>
    </AccordionPrimitive.Content>
  );
}
