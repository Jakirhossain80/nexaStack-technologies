'use client';

import {
  QUOTATION_STATUS,
  getAvailableQuotationTransitions,
  type QuotationStatus,
} from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { QUOTATION_STATUS_LABELS } from '@/components/admin/quotations/QuotationStatusBadge';
import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/lib/adminRequest';

export interface QuotationStatusControlProps {
  quotationId: string;
  status: QuotationStatus;
}

const BUTTON_LABELS: Record<QuotationStatus, string> = {
  [QUOTATION_STATUS.NEW]: 'Move back to new',
  [QUOTATION_STATUS.REVIEWING]: 'Mark as reviewing',
  [QUOTATION_STATUS.QUOTE_SENT]: 'Mark quote as sent',
  [QUOTATION_STATUS.ACCEPTED]: 'Mark as accepted',
  [QUOTATION_STATUS.DECLINED]: 'Mark as declined',
  [QUOTATION_STATUS.CLOSED]: 'Mark as closed',
};

/**
 * The reachable status changes for this request, rendered from the shared transition table (the
 * same one the API enforces), so it can only offer moves the server will accept. The result is
 * announced through an always-mounted live region, not just shown: a screen-reader user hears
 * "Marked as quote sent." rather than getting a silent visual change.
 */
export function QuotationStatusControl({ quotationId, status }: QuotationStatusControlProps) {
  const router = useRouter();
  const [pending, setPending] = useState<QuotationStatus | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function moveTo(target: QuotationStatus) {
    // Buttons use `aria-disabled` while saving, not `disabled`: a button that becomes `disabled`
    // loses keyboard focus, so activation is ignored here instead.
    if (pending !== null) return;
    setPending(target);
    setMessage(null);

    const result = await adminRequest('PATCH', `/api/v1/admin/quotations/${quotationId}/status`, {
      status: target,
    });

    setPending(null);
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error.message });
      return;
    }
    setMessage({
      kind: 'success',
      text: `Marked as ${QUOTATION_STATUS_LABELS[target].toLowerCase()}.`,
    });
    // The button just pressed is usually no longer offered, so it leaves the page and keyboard
    // focus would fall to nowhere. Park focus on this section's heading instead: the user keeps
    // their place, Tab continues into the buttons that remain, and the live region still announces
    // the result.
    headingRef.current?.focus();
    router.refresh();
  }

  return (
    <div role="group" aria-labelledby="quotation-status-heading">
      <h3
        id="quotation-status-heading"
        ref={headingRef}
        tabIndex={-1}
        className="rounded-field text-body font-semibold text-primary focus-ring"
      >
        Status
      </h3>
      <p className="mt-1 text-label text-secondary">
        Current status:{' '}
        <strong className="font-semibold text-primary">{QUOTATION_STATUS_LABELS[status]}</strong>.
        Opening a request does not change its status; record each step yourself.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {getAvailableQuotationTransitions(status).map((target) => (
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
