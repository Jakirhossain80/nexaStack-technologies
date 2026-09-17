export interface FieldErrorProps {
  id: string;
  message?: string;
}

/**
 * Inline validation message, linked to its field via `aria-describedby` (root CLAUDE.md 14).
 * Pairs an icon with the text so the error isn't conveyed by colour alone. Renders nothing (but
 * keeps its `id` slot available) when there's no message, so `aria-describedby` never points at
 * a missing element.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return <p id={id} className="sr-only" />;

  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-label text-error">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 size-3.5 shrink-0"
      >
        <circle cx="10" cy="10" r="7.25" />
        <path d="M10 6.5v4M10 13.5h.01" />
      </svg>
      <span>{message}</span>
    </p>
  );
}
