'use client';

import type { QuotationAttachmentAdmin } from '@nexastack/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminApiFetch } from '@/lib/adminApi';
import { formatFileSize } from '@/lib/quotationLabels';

export interface QuotationAttachmentListProps {
  quotationId: string;
  attachments: readonly QuotationAttachmentAdmin[];
}

/** "PDF · 1.2 MB", or what is known of it. */
function describe(attachment: QuotationAttachmentAdmin): string {
  const parts = [
    attachment.format,
    attachment.sizeBytes !== null ? formatFileSize(attachment.sizeBytes) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : 'Type and size unavailable';
}

/**
 * The files a client attached. There is no link to the file itself: the browser is never given a
 * storage address. Each Download asks the API for the file, which checks the admin session, fetches
 * it from private storage and streams it back; the response is saved from memory. A refusal (session
 * expired, storage not configured, file missing) is shown next to the list instead of navigating
 * away to a JSON error.
 *
 * Every button carries the file's own name in its accessible name ("Download brief.pdf, PDF · 1.2
 * MB"), so a screen-reader user can tell the buttons apart without reading the surrounding text.
 */
export function QuotationAttachmentList({ quotationId, attachments }: QuotationAttachmentListProps) {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (attachments.length === 0) {
    return <p className="text-body text-secondary">No files were attached to this request.</p>;
  }

  async function download(attachment: QuotationAttachmentAdmin) {
    // `aria-disabled` (below), not `disabled`, while downloading: a button that becomes `disabled`
    // loses keyboard focus, so activation is ignored here instead.
    if (pendingIndex !== null) return;
    setPendingIndex(attachment.index);
    setMessage(null);

    try {
      const response = await adminApiFetch(
        `/api/v1/admin/quotations/${quotationId}/attachments/${attachment.index}`,
      );

      if (!response.ok) {
        let text = `Could not download ${attachment.name}. Please try again.`;
        try {
          const body = (await response.json()) as { error?: { message?: string } };
          if (body.error?.message) text = body.error.message;
        } catch {
          /* keep the generic message */
        }
        setMessage({ kind: 'error', text });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage({ kind: 'success', text: `Downloaded ${attachment.name}.` });
    } catch {
      setMessage({
        kind: 'error',
        text: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setPendingIndex(null);
    }
  }

  return (
    <div>
      <ul aria-label="Attachments" className="space-y-3">
        {attachments.map((attachment) => (
          <li
            key={attachment.index}
            className="flex flex-col gap-3 rounded-field border border-default bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium break-words text-primary">{attachment.name}</p>
              <p className="text-label text-secondary">
                {attachment.available
                  ? describe(attachment)
                  : 'Not available: its stored link is not a recognised NexaStack upload, so it is not offered for download.'}
              </p>
            </div>

            {attachment.available && (
              <Button
                variant="secondary"
                aria-label={`Download ${attachment.name}, ${describe(attachment)}`}
                aria-disabled={pendingIndex !== null || undefined}
                className="shrink-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                onClick={() => void download(attachment)}
              >
                {pendingIndex === attachment.index ? 'Downloading…' : 'Download'}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {/* Always mounted so a screen reader announces the result when it appears. */}
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
