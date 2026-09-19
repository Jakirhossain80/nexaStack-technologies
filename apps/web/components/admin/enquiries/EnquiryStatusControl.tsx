'use client';

import { getAvailableEnquiryTransitions, type EnquiryStatus } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { ENQUIRY_STATUS_LABELS } from '@/components/admin/enquiries/EnquiryStatusBadge';
import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/lib/adminRequest';

export interface EnquiryStatusControlProps {
  enquiryId: string;
  status: EnquiryStatus;
}

const BUTTON_LABELS: Record<EnquiryStatus, string> = {
  new: 'Mark as new',
  read: 'Mark as read',
  contacted: 'Mark as contacted',
  closed: 'Mark as closed',
};

/**
 * The reachable status changes for this enquiry, rendered from the shared transition table (the
 * same one the API enforces), so it can only offer moves the server will accept. The result is
 * announced through an always-mounted live region, not just shown: a screen-reader user hears
 * "Marked as contacted." rather than getting a silent visual change.
 */
export function EnquiryStatusControl({ enquiryId, status }: EnquiryStatusControlProps) {
  const router = useRouter();
  const [pending, setPending] = useState<EnquiryStatus | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function moveTo(target: EnquiryStatus) {
    // Buttons use `aria-disabled` while saving, not `disabled`: a button that becomes `disabled`
    // loses keyboard focus, so activation is ignored here instead.
    if (pending !== null) return;
    setPending(target);
    setMessage(null);

    const result = await adminRequest('PATCH', `/api/v1/admin/enquiries/${enquiryId}/status`, {
      status: target,
    });

    setPending(null);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error.message });
      return;
    }
    setMessage({
      kind: 'success',
      text: `Marked as ${ENQUIRY_STATUS_LABELS[target].toLowerCase()}.`,
    });
    // The button just pressed is usually no longer offered (a `contacted` enquiry has no "Mark as
    // contacted"), so it leaves the page and keyboard focus would fall to nowhere. Park focus on
    // this section's heading instead: the user keeps their place, Tab continues into the buttons
    // that remain, and the live region above still announces the result.
    headingRef.current?.focus();
    router.refresh();
  }

  return (
    <div role="group" aria-labelledby="status-control-heading">
      <h3
        id="status-control-heading"
        ref={headingRef}
        tabIndex={-1}
        className="rounded-field text-body font-semibold text-primary focus-ring"
      >
        Status
      </h3>
      <p className="mt-1 text-label text-secondary">
        Current status:{' '}
        <strong className="font-semibold text-primary">{ENQUIRY_STATUS_LABELS[status]}</strong>.
        Opening an enquiry marks it read; the other steps are yours to record.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {getAvailableEnquiryTransitions(status).map((target) => (
          <Button
            key={target}
            variant="secondary"
            aria-disabled={pending !== null || undefined}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            onClick={() => void moveTo(target)}
          >
            {pending === target ? 'Saving…' : BUTTON_LABELS[target]}
          </Button>
        ))}
      </div>

      {/* Always mounted so a screen reader announces the message when it appears. */}
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
