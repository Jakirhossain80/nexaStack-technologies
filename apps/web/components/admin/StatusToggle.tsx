'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminApiFetch } from '@/lib/adminApi';

export type SubmissionKind = 'enquiries' | 'quotations';
export type SubmissionStatus = 'new' | 'responded';

export interface StatusToggleProps {
  kind: SubmissionKind;
  id: string;
  currentStatus: SubmissionStatus;
}

const NEXT_STATUS: Record<SubmissionStatus, SubmissionStatus> = {
  new: 'responded',
  responded: 'new',
};

/**
 * Status only — not a general edit endpoint (task boundary). Reversible in either
 * direction (not just new -> responded) so a mistaken toggle can be corrected. Label states
 * current status and the resulting action, per the dashboard task's accessibility note.
 */
export function StatusToggle({ kind, id, currentStatus }: StatusToggleProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const nextStatus = NEXT_STATUS[currentStatus];

  async function handleToggle() {
    setIsUpdating(true);
    try {
      await adminApiFetch(`/api/v1/admin/${kind}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => void handleToggle()}
      disabled={isUpdating}
      aria-label={`Mark as ${nextStatus} — currently ${currentStatus}`}
    >
      {isUpdating ? 'Updating…' : `Mark as ${nextStatus}`}
    </Button>
  );
}
