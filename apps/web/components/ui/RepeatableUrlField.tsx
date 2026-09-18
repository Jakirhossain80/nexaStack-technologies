'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/Input';

export interface RepeatableUrlFieldProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  invalid?: boolean;
  describedById?: string;
}

/**
 * Up to `max` repeatable URL inputs (reference websites, root CLAUDE.md 10 — optional). Kept as
 * plain component state on the parent's `values`/`onChange` rather than a form-array library:
 * a handful of rows doesn't need `useFieldArray`'s bookkeeping, and root CLAUDE.md 5 already
 * says component state covers this.
 */
export function RepeatableUrlField({
  id,
  label,
  values,
  onChange,
  max,
  invalid,
  describedById,
}: RepeatableUrlFieldProps) {
  const legendId = useId();
  const rows = values.length === 0 ? [''] : values;

  function updateRow(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next.filter((row, i) => row.trim() !== '' || i === index));
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(next);
  }

  function addRow() {
    if (rows.length >= max) return;
    onChange([...rows, '']);
  }

  return (
    <fieldset>
      <legend id={legendId} className="block text-label font-medium text-primary">
        {label} (optional)
      </legend>
      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              id={index === 0 ? id : undefined}
              type="url"
              inputMode="url"
              placeholder="https://example.com"
              value={row}
              invalid={invalid}
              aria-label={`${label} ${index + 1}`}
              aria-describedby={describedById}
              onChange={(event) => updateRow(index, event.target.value)}
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded-field px-2 py-1 text-label text-error underline underline-offset-4 focus-ring"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {rows.length < max && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 rounded-field px-2 py-1 text-label text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
        >
          + Add another website
        </button>
      )}
    </fieldset>
  );
}
