import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Styled native checkbox (no Radix — a checkbox isn't risky to hand-roll, root CLAUDE.md 5).
 * Sized to sit inline with its label text; the label itself supplies the ≥44px touch target by
 * wrapping both (see `ContactForm`'s consent field).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-invalid={invalid || undefined}
      className={cn(
        'mt-0.5 size-5 shrink-0 rounded border bg-surface accent-primary-blue focus-ring',
        invalid ? 'border-error' : 'border-strong',
        className,
      )}
      {...props}
    />
  );
});
