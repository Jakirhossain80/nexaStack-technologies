'use client';

export interface ResolvedValueProps {
  /** Raw token variable to read, e.g. `--nx-surface`. */
  variable: `--nx-${string}`;
}

/**
 * TEMPORARY (proof sheet). Prints the value a token variable resolves to at this element, so
 * swatches can be checked against CLAUDE.md 7.1 without hex values in component source.
 */
export function ResolvedValue({ variable }: ResolvedValueProps) {
  return (
    <code
      className="font-mono text-label text-secondary"
      ref={(node) => {
        if (node) {
          node.textContent = getComputedStyle(node).getPropertyValue(variable).trim().toUpperCase();
        }
      }}
    />
  );
}
