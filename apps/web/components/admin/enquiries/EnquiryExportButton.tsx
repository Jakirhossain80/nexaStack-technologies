'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminApiFetch } from '@/lib/adminApi';

export interface EnquiryExportButtonProps {
  /** How many enquiries the current filter matches (from the list the page just rendered). */
  matchCount: number;
}

/** The filter params the export shares with the list. `page` is deliberately NOT one of them. */
const FILTER_PARAMS = ['q', 'status', 'archived'] as const;

/**
 * Exports EXACTLY what the list is showing: it builds the export URL from the live `q`, `status`
 * and `archived` params (never `page`), and the API applies the same filter function as the list.
 * Downloads via `fetch` -> blob so a failure (session expired, too many rows) is shown to the admin
 * instead of navigating to a JSON error page, and so the result can be announced.
 */
export function EnquiryExportButton({ matchCount }: EnquiryExportButtonProps) {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function exportCsv() {
    // `aria-disabled` (below), not `disabled`, while exporting: a button that becomes `disabled`
    // loses keyboard focus, so activation is ignored here instead.
    if (pending) return;
    setPending(true);
    setMessage(null);

    const params = new URLSearchParams();
    for (const name of FILTER_PARAMS) {
      const value = searchParams.get(name);
      if (value) params.set(name, value);
    }
    const query = params.toString();

    try {
      const response = await adminApiFetch(
        `/api/v1/admin/enquiries/export${query ? `?${query}` : ''}`,
      );

      if (!response.ok) {
        let text = 'The export failed. Please try again.';
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
      link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage({
        kind: 'success',
        text: `Exported ${matchCount} ${matchCount === 1 ? 'enquiry' : 'enquiries'} matching the current search and filters.`,
      });
    } catch {
      setMessage({
        kind: 'error',
        text: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        disabled={matchCount === 0}
        aria-disabled={pending || undefined}
        className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        onClick={() => void exportCsv()}
        aria-describedby="export-hint"
      >
        {pending ? 'Exporting…' : 'Export CSV'}
      </Button>
      <p id="export-hint" className="mt-1 text-label text-secondary">
        {matchCount === 0
          ? 'Nothing to export for this view.'
          : 'Exports what is listed, using the current search and filters.'}
      </p>

      {/* Always mounted so a screen reader announces the result when it appears. */}
      <p
        role={message?.kind === 'error' ? 'alert' : 'status'}
        className={
          message?.kind === 'error'
            ? 'mt-2 text-body text-error'
            : message
              ? 'mt-2 text-body text-primary'
              : 'sr-only'
        }
      >
        {message?.text}
      </p>
    </div>
  );
}
