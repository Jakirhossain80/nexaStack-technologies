import type { ReactNode } from 'react';

import { FieldError } from '@/components/ui/FieldError';

export interface FormFieldProps {
  /** The control's `id`. The hint and error get `${id}-hint` and `${id}-error`. */
  id: string;
  label: string;
  /** Explicit text marker, never colour or an asterisk alone (root CLAUDE.md 10). */
  required?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
}

/**
 * Label above the field, an explicit "(required)"/"(optional)" marker, optional hint text and the
 * inline error, wired up by id. The control passes `aria-describedby="${id}-hint ${id}-error"` so a
 * screen reader reads both with the field. Shared by every admin editor form.
 */
export function FormField({ id, label, required = false, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-label font-medium text-primary">
        {label}{' '}
        <span className="font-normal text-secondary">({required ? 'required' : 'optional'})</span>
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-label text-secondary">
          {hint}
        </p>
      ) : (
        <p id={`${id}-hint`} className="sr-only" />
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
