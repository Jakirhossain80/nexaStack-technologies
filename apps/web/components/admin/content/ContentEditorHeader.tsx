import type { ContentStatus } from '@nexastack/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/admin/content/StatusBadge';

export interface ContentEditorHeaderProps {
  /** The page's single `<h1>`. */
  title: string;
  /** Omit for a new, unsaved item. */
  status?: ContentStatus;
  backHref: string;
  backLabel: string;
  /** Extra text under the title, for example the last-updated time. */
  description?: ReactNode;
}

/**
 * Title row shared by every full-CMS editor and preview page: a back link, the one `<h1>`, and
 * the item's status badge. The type-specific form and action bar sit below it.
 */
export function ContentEditorHeader({
  title,
  status,
  backHref,
  backLabel,
  description,
}: ContentEditorHeaderProps) {
  return (
    <header>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center rounded-field text-label text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
      >
        <span aria-hidden="true">←&nbsp;</span>
        {backLabel}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-page font-semibold tracking-tight text-primary">{title}</h1>
        {status && <StatusBadge status={status} />}
      </div>
      {description && <p className="mt-2 text-body text-secondary">{description}</p>}
    </header>
  );
}
