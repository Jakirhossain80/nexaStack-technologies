import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Styled textarea primitive — same field treatment as `Input` (root CLAUDE.md 8). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-32 w-full rounded-field border bg-surface px-3.5 py-3 text-body text-primary placeholder:text-secondary focus-ring',
        invalid ? 'border-error' : 'border-strong',
        className,
      )}
      {...props}
    />
  );
});
