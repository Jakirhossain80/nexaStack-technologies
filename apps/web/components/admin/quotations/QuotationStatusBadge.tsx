import { QUOTATION_STATUS, type QuotationStatus } from '@nexastack/shared';

import { cn } from '@/lib/cn';

export interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  [QUOTATION_STATUS.NEW]: 'New',
  [QUOTATION_STATUS.REVIEWING]: 'Reviewing',
  [QUOTATION_STATUS.QUOTE_SENT]: 'Quote sent',
  [QUOTATION_STATUS.ACCEPTED]: 'Accepted',
  [QUOTATION_STATUS.DECLINED]: 'Declined',
  [QUOTATION_STATUS.CLOSED]: 'Closed',
};

// Existing tokens only. The TEXT LABEL carries the meaning (root CLAUDE.md 14); each status also
// has its own border weight/style, so the six are tellable apart without relying on colour:
//   new         thick blue border, semibold   ("needs a first look")
//   reviewing   plain strong border
//   quote-sent  thin blue border, blue text   ("ball is in the client's court")
//   accepted    thick green border, semibold  ("won")
//   declined    thin red border
//   closed      dashed, muted                 ("finished")
// Text is text-primary, text-primary-blue-hover, text-success, text-error or text-secondary, each
// a verified pairing on surface / background-alt in both themes (root CLAUDE.md 7.1).
const STYLES: Record<QuotationStatus, string> = {
  [QUOTATION_STATUS.NEW]: 'border-2 border-primary-blue bg-surface font-semibold text-primary',
  [QUOTATION_STATUS.REVIEWING]: 'border border-strong bg-surface font-medium text-primary',
  [QUOTATION_STATUS.QUOTE_SENT]:
    'border border-primary-blue bg-surface font-medium text-primary-blue-hover',
  [QUOTATION_STATUS.ACCEPTED]: 'border-2 border-success bg-surface font-semibold text-success',
  [QUOTATION_STATUS.DECLINED]: 'border border-error bg-surface font-medium text-error',
  [QUOTATION_STATUS.CLOSED]:
    'border border-dashed border-default bg-background-alt font-medium text-secondary',
};

/** The pipeline status of a quotation request, in the list rows and on the detail page. */
export function QuotationStatusBadge({ status, className }: QuotationStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-label',
        STYLES[status],
        className,
      )}
    >
      {QUOTATION_STATUS_LABELS[status]}
    </span>
  );
}
