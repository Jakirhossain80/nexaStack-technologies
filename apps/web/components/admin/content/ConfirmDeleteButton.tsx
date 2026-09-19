'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/lib/adminRequest';

export interface ConfirmDeleteButtonProps {
  /** `DELETE` target. */
  url: string;
  /** What is being deleted, for the confirmation text: "post", "category". */
  itemLabel: string;
  /** Where to go after a successful delete. Omit to stay on the page and refresh it. */
  redirectTo?: string;
  disabled?: boolean;
  /** Visible label of the first click. */
  label?: string;
}

/**
 * Two-step delete: the first click only asks; the second, on an explicit "Yes, delete" button,
 * acts. Inline rather than a modal: nothing here needs a focus trap, and a confirm step in the
 * normal tab order is simpler to make correct than a dialog (root CLAUDE.md 5).
 */
export function ConfirmDeleteButton({
  url,
  itemLabel,
  redirectTo,
  disabled = false,
  label = 'Delete',
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const result = await adminRequest('DELETE', url);
    setPending(false);

    if (!result.ok) {
      setError(result.error.message);
      setConfirming(false);
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  if (!confirming) {
    return (
      <div>
        <Button variant="secondary" disabled={disabled} onClick={() => setConfirming(true)}>
          {label}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-label text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirm deleting this ${itemLabel}`}
      className="flex flex-wrap items-center gap-3"
    >
      <span className="text-body text-primary">
        Delete this {itemLabel}? This cannot be undone.
      </span>
      <Button variant="secondary" disabled={pending} onClick={() => void remove()}>
        {pending ? 'Deleting…' : 'Yes, delete'}
      </Button>
      <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
