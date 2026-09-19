import type { EnquiryNoteAdmin } from '@nexastack/shared';

import { company } from '@/config/company';

export interface EnquiryNotesProps {
  notes: readonly EnquiryNoteAdmin[];
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

/**
 * The internal notes on an enquiry, oldest first (a conversation log). Text is rendered as plain
 * text (React escapes it) with line breaks preserved. Notes are append-only: there is no edit or
 * delete, so the record of what was said and by whom stays trustworthy.
 */
export function EnquiryNotes({ notes }: EnquiryNotesProps) {
  if (notes.length === 0) {
    return <p className="text-body text-secondary">No notes yet.</p>;
  }

  return (
    <ol aria-label="Internal notes, oldest first" className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-field border border-default bg-surface p-4">
          {/* Two flex items that wrap between them, rather than inline text that can split mid-item. */}
          <p className="flex flex-wrap items-baseline gap-x-2 text-label text-secondary">
            <span className="font-medium break-all text-primary">
              {note.authorEmail ?? 'Unknown admin'}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={note.createdAt}>{formatTimestamp(note.createdAt)}</time>
          </p>
          <p className="mt-2 text-body break-words whitespace-pre-wrap text-primary">{note.text}</p>
        </li>
      ))}
    </ol>
  );
}
