import { ENQUIRY_STATUS, type EnquiryStatus } from '@nexastack/shared';

import { cn } from '@/lib/cn';

export interface EnquiryStatusBadgeProps {
  status: EnquiryStatus;
  className?: string;
}

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  [ENQUIRY_STATUS.NEW]: 'New',
  [ENQUIRY_STATUS.READ]: 'Read',
  [ENQUIRY_STATUS.CONTACTED]: 'Contacted',
  [ENQUIRY_STATUS.CLOSED]: 'Closed',
};

// Existing tokens only. The TEXT LABEL carries the meaning (root CLAUDE.md 14); each status also
// has a distinct border weight/style, so the four are tellable apart without relying on colour:
//   new       thick blue border, semibold  ("needs a first look")
//   read      plain strong border
//   contacted success border
//   closed    dashed, muted                ("finished")
// Text is always text-primary, text-success or text-secondary on surface/background-alt, never a
// low-contrast accent colour.
const STYLES: Record<EnquiryStatus, string> = {
  [ENQUIRY_STATUS.NEW]: 'border-2 border-primary-blue bg-surface font-semibold text-primary',
  [ENQUIRY_STATUS.READ]: 'border border-strong bg-surface font-medium text-primary',
  [ENQUIRY_STATUS.CONTACTED]: 'border border-success bg-surface font-medium text-success',
  [ENQUIRY_STATUS.CLOSED]:
    'border border-dashed border-default bg-background-alt font-medium text-secondary',
};

/** The reply-workflow status of a Contact enquiry, in the list rows and on the detail page. */
export function EnquiryStatusBadge({ status, className }: EnquiryStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-label',
        STYLES[status],
        className,
      )}
    >
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  );
}
