import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: readonly SelectOption[];
  placeholder?: string;
}

/**
 * Styled native `<select>` primitive — same field treatment as `Input`/`Textarea` (root
 * CLAUDE.md 8). Native `<select>` rather than a Radix/headless combobox: full keyboard and
 * screen-reader support come for free and nothing here needs search-as-you-type or async
 * options, so a hand-rolled listbox would only add risk (root CLAUDE.md 5).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, options, placeholder, defaultValue, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        // Uncontrolled by default (react-hook-form's `register`). A caller that passes `value`
        // controls it, and must not also get a `defaultValue` (React warns about both).
        defaultValue={props.value === undefined ? (defaultValue ?? '') : undefined}
        className={cn(
          'min-h-11 w-full appearance-none rounded-field border bg-surface px-3.5 pr-10 text-body text-primary focus-ring',
          invalid ? 'border-error' : 'border-strong',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-secondary"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>
    </div>
  );
});
