import { CONTENT_STATUS, type ContentStatus } from '@nexastack/shared';

import { cn } from '@/lib/cn';

export interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

const LABELS: Record<ContentStatus, string> = {
  [CONTENT_STATUS.DRAFT]: 'Draft',
  [CONTENT_STATUS.PUBLISHED]: 'Published',
  [CONTENT_STATUS.UNPUBLISHED]: 'Unpublished',
  [CONTENT_STATUS.ARCHIVED]: 'Archived',
};

// Existing tokens only. Meaning is carried by the TEXT LABEL, never by colour alone (root
// CLAUDE.md 14): the colour and border style are reinforcement. Every text/background pair below
// is a text-primary/secondary/success on surface or background-alt, verified ≥4.5:1 in both themes.
const STYLES: Record<ContentStatus, string> = {
  // Dashed border: "not finished".
  [CONTENT_STATUS.DRAFT]: 'border-dashed border-strong bg-surface text-primary',
  [CONTENT_STATUS.PUBLISHED]: 'border-success bg-surface text-success',
  [CONTENT_STATUS.UNPUBLISHED]: 'border-strong bg-background-alt text-primary',
  [CONTENT_STATUS.ARCHIVED]: 'border-default bg-background-alt text-secondary',
};

/**
 * The publication status of any managed content item. Shared by every full-CMS content type: the
 * list rows, the editor header and the preview banner all render this one component.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-label font-medium',
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
