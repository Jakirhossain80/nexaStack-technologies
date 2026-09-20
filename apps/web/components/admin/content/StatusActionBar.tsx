'use client';

import { CONTENT_STATUS, getAvailableTransitions, type ContentStatus } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminRequest } from '@/lib/adminRequest';

export interface StatusActionBarProps {
  status: ContentStatus;
  /** `POST` target that takes `{ status }`. */
  statusUrl: string;
  /** When set, every action is disabled and this is shown as the reason (for example unsaved edits). */
  disabledReason?: string | undefined;
  /** Runs after the API confirms a status change and before the page refreshes, e.g. to expire a public cache. */
  onSuccess?: (() => void | Promise<void>) | undefined;
}

interface ActionCopy {
  label: string;
  pending: string;
  done: string;
}

// Keyed by the status an action moves the item TO.
const ACTIONS: Record<ContentStatus, ActionCopy> = {
  [CONTENT_STATUS.PUBLISHED]: {
    label: 'Publish',
    pending: 'Publishing…',
    done: 'Published. It is now live on the public site.',
  },
  [CONTENT_STATUS.UNPUBLISHED]: {
    label: 'Unpublish',
    pending: 'Unpublishing…',
    done: 'Unpublished. It is no longer visible on the public site.',
  },
  [CONTENT_STATUS.ARCHIVED]: {
    label: 'Archive',
    pending: 'Archiving…',
    done: 'Archived. It is hidden from the active list.',
  },
  [CONTENT_STATUS.DRAFT]: {
    label: 'Restore to draft',
    pending: 'Restoring…',
    done: 'Restored to a draft. It can be edited again.',
  },
};

/**
 * The status actions available for a content item, rendered from the shared transition table
 * (`CONTENT_STATUS_TRANSITIONS`) — the same table the API enforces, so this can only offer moves
 * the server will accept. Shared by every full-CMS content type.
 */
export function StatusActionBar({ status, statusUrl, disabledReason, onSuccess }: StatusActionBarProps) {
  const router = useRouter();
  const [pendingTarget, setPendingTarget] = useState<ContentStatus | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function moveTo(target: ContentStatus) {
    setPendingTarget(target);
    setMessage(null);

    const result = await adminRequest('POST', statusUrl, { status: target });

    if (result.ok) await onSuccess?.();
    setPendingTarget(null);
    if (result.ok) {
      setMessage({ kind: 'success', text: ACTIONS[target].done });
      router.refresh();
    } else {
      setMessage({ kind: 'error', text: result.error.message });
    }
  }

  const busy = pendingTarget !== null;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {getAvailableTransitions(status).map((target) => (
          <Button
            key={target}
            variant={target === CONTENT_STATUS.PUBLISHED ? 'primary' : 'secondary'}
            disabled={busy || Boolean(disabledReason)}
            onClick={() => void moveTo(target)}
          >
            {pendingTarget === target ? ACTIONS[target].pending : ACTIONS[target].label}
          </Button>
        ))}
      </div>

      {disabledReason && <p className="mt-2 text-label text-secondary">{disabledReason}</p>}

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
