import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Styled text/email/tel input primitive (root CLAUDE.md 8: solid neutral surface, 1px
 * `border-strong`, blue focus ring, no glassmorphism). `invalid` swaps the border colour only —
 * meaning is still carried by the linked `FieldError`, never colour alone (root CLAUDE.md 14).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-11 w-full rounded-field border bg-surface px-3.5 text-body text-primary placeholder:text-secondary focus-ring',
        invalid ? 'border-error' : 'border-strong',
        className,
      )}
      {...props}
    />
  );
});
