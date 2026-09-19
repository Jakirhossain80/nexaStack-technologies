'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/lib/adminRequest';

export interface EnquiryArchiveButtonProps {
  enquiryId: string;
  archived: boolean;
}

/**
 * Archive / restore. Archiving is about the working view, not the reply workflow: it works from
 * any status and does not change the status. The result is announced via a live region.
 */
export function EnquiryArchiveButton({ enquiryId, archived }: EnquiryArchiveButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function toggle() {
    // `aria-disabled` (below), not `disabled`, while saving: a button that becomes `disabled`
    // loses keyboard focus, so activation is ignored here instead.
    if (pending) return;
    setPending(true);
    setMessage(null);

    const action = archived ? 'unarchive' : 'archive';
    const result = await adminRequest('PATCH', `/api/v1/admin/enquiries/${enquiryId}/${action}`);

    setPending(false);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error.message });
      return;
    }
    setMessage({
      kind: 'success',
      text: archived
        ? 'Restored. It is back in the active list.'
        : 'Archived. It is hidden from the active list; choose "Archived enquiries" to see it.',
    });
    router.refresh();
  }

  return (
    <div>
      <h3 className="text-body font-semibold text-primary">Archive</h3>
      <p className="mt-1 text-label text-secondary">
        {archived
          ? 'This enquiry is archived and hidden from the active list.'
          : 'Remove this enquiry from the active list. Its status is kept, and you can restore it.'}
      </p>
      <Button
        variant="secondary"
        className="mt-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        aria-disabled={pending || undefined}
        onClick={() => void toggle()}
      >
        {pending
          ? archived
            ? 'Restoring…'
            : 'Archiving…'
          : archived
            ? 'Restore to active list'
            : 'Archive enquiry'}
      </Button>

      <p
        role={message?.kind === 'error' ? 'alert' : 'status'}
        className={
          message?.kind === 'error'
            ? 'mt-3 text-body text-error'
            : message
              ? 'mt-3 text-body text-primary'
              : 'sr-only'
        }
      >
        {message?.text}
      </p>
    </div>
  );
}
