import { cn } from '@/lib/cn';

export interface ToggleOption {
  value: string;
  label: string;
}

export interface YesNoToggleProps {
  legend: string;
  name: string;
  options: readonly ToggleOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedById?: string;
  required?: boolean;
}

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);

/**
 * A `<fieldset>` of native radios styled as a segmented pair/trio (yes/no and yes/no/not-sure
 * questions). Controlled (`value`/`onChange`) rather than `register()`-spread so it also works
 * for the two boolean fields (needs-admin-dashboard, needs-authentication), which the shared
 * schema types as `z.boolean()`, not a string enum — the caller wires it up with either
 * `register()`'s `onChange` or a `Controller` render prop that maps 'yes'/'no' to `true`/`false`.
 * Native radio semantics rather than a custom ARIA switch — just as accessible, and there's
 * nothing here a hand-rolled widget does better (root CLAUDE.md 5).
 */
export function YesNoToggle({
  legend,
  name,
  options,
  value,
  onChange,
  onBlur,
  invalid,
  describedById,
  required,
}: YesNoToggleProps) {
  return (
    <fieldset>
      <legend className="block text-label font-medium text-primary">
        {legend}
        {required && REQUIRED_MARK}
      </legend>
      {/* No `role`/`aria-invalid` here: `<fieldset>` already exposes a group semantic natively,
          and "group" isn't a widget role ARIA defines `aria-invalid` for — the error is still
          conveyed via the linked `FieldError` (`describedById`) and each label's `border-error`. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 min-w-24 cursor-pointer items-center justify-center gap-2 rounded-field border px-4 text-body text-primary has-[:checked]:border-primary-blue has-[:checked]:bg-primary-blue has-[:checked]:text-on-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-blue',
              invalid ? 'border-error' : 'border-strong',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              className="sr-only"
              aria-describedby={describedById}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
