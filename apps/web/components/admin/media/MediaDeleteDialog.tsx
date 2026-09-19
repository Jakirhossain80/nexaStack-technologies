'use client';

import type { MediaAdmin } from '@nexastack/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { adminRequest } from '@/lib/adminRequest';
import { scanMediaReferencesAction } from '@/lib/mediaActions';
import {
  SCAN_FOUND_WARNING,
  summarizeScan,
  type MediaReferenceScan,
} from '@/lib/mediaReferenceScan';

export interface MediaDeleteDialogProps {
  media: Pick<MediaAdmin, 'id' | 'filename'>;
  /**
   * Blog posts that REALLY use this image (they store its id). While there are any, deletion is
   * blocked outright: this is a certainty, not the best-effort hint below, so the confirm flow is not
   * offered at all. The API refuses the delete for the same reason.
   */
  usage: readonly { id: string; title: string; status: string }[];
}

type ScanState =
  | { status: 'loading' }
  | { status: 'done'; scan: MediaReferenceScan }
  | { status: 'error'; message: string };

/**
 * Permanent deletion, with deliberate friction rather than a confirm button that is easy to click
 * through:
 *
 *  1. Opening the dialog runs the best-effort "where might this be used?" check. Its wording is fixed
 *     in `lib/mediaReferenceScan.ts` and never says "unused" or "safe": it states how many places
 *     were checked and that this is not a guarantee.
 *  2. The admin must TYPE the file name. The button stays inactive (and says why) until it matches
 *     exactly, and the API refuses a mismatch again server-side.
 *  3. If possible references were found, a second, explicit acknowledgement is required as well.
 *
 * The dialog's own text states exactly what will happen, so someone using only a screen reader knows
 * what they are about to do. Radix provides the focus trap, Escape to close and focus return.
 *
 * Before any of that: if blog posts use this image as their cover, none of it applies. The dialog says
 * so, lists them, and offers only a way out.
 */
export function MediaDeleteDialog({ media, usage }: MediaDeleteDialogProps) {
  const router = useRouter();
  const typedId = useId();
  const ackId = useId();
  const blocked = usage.length > 0;

  const [open, setOpen] = useState(false);
  const [scan, setScan] = useState<ScanState>({ status: 'loading' });
  const [typed, setTyped] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each time the dialog opens, run the check. (The state is reset in the open handler below, not
  // here: an effect that sets state on entry causes an extra render.)
  useEffect(() => {
    // Nothing to check when deletion is blocked outright.
    if (!open || blocked) return;
    let cancelled = false;

    scanMediaReferencesAction(media.id)
      .then((result) => {
        if (cancelled) return;
        setScan(
          result.ok
            ? { status: 'done', scan: result.scan }
            : { status: 'error', message: result.message },
        );
      })
      .catch(() => {
        if (!cancelled) setScan({ status: 'error', message: 'The check could not be run.' });
      });

    return () => {
      cancelled = true;
    };
  }, [open, blocked, media.id]);

  const matchCount = scan.status === 'done' ? scan.scan.matches.length : 0;
  const summary = scan.status === 'done' ? summarizeScan(scan.scan) : null;

  const nameMatches = typed === media.filename;
  const acknowledgementOk = matchCount === 0 || acknowledged;
  const checkFinished = scan.status !== 'loading';
  const canDelete = nameMatches && acknowledgementOk && checkFinished && !pending;

  // Why the button is inactive, in words: it is not a mystery to a keyboard or screen-reader user.
  const blockedReason = pending
    ? null
    : !checkFinished
      ? 'Waiting for the check to finish.'
      : !nameMatches
        ? 'Type the file name exactly to enable deletion.'
        : !acknowledgementOk
          ? 'Tick the box to confirm you understand.'
          : null;

  async function remove() {
    // `aria-disabled` (below), not `disabled`: a button that becomes `disabled` loses keyboard focus,
    // so activation is ignored here instead.
    if (!canDelete) return;
    setPending(true);
    setError(null);

    const result = await adminRequest('DELETE', `/api/v1/admin/media/${media.id}`, {
      confirmFilename: typed,
      referencesReported: matchCount,
      referencesAcknowledged: acknowledged,
    });

    if (!result.ok) {
      setPending(false);
      setError(result.error.message);
      return;
    }

    // The item is gone, so its page is too: go to the list and say what happened there.
    router.push(`/admin/media?deleted=${encodeURIComponent(media.filename)}`);
    router.refresh();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        // Not while a delete is in flight: closing then would hide the outcome.
        if (pending) return;
        if (next) {
          // Opening: start from a clean slate; the effect above then runs the check.
          setScan({ status: 'loading' });
          setTyped('');
          setAcknowledged(false);
          setError(null);
        }
        setOpen(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="secondary"
          className="border-error text-error not-disabled:hover:border-error"
        >
          Delete this file…
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-11/12 w-11/12 max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-default bg-surface p-5 sm:p-6">
          <Dialog.Title className="text-card font-semibold break-words text-primary">
            {blocked ? (
              <>&ldquo;{media.filename}&rdquo; can&rsquo;t be deleted yet</>
            ) : (
              <>Delete &ldquo;{media.filename}&rdquo; permanently?</>
            )}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-body text-primary">
            {blocked ? (
              <>
                This image is the cover image of {usage.length} blog{' '}
                {usage.length === 1 ? 'post' : 'posts'}. Deleting it would break{' '}
                {usage.length === 1 ? 'it' : 'them'}, so it is blocked until{' '}
                {usage.length === 1 ? 'that post uses' : 'those posts use'} a different image or
                none.
              </>
            ) : (
              <>
                This removes the file from the Media Library and deletes it from Cloudinary, where
                it is stored. It cannot be undone. Any page or post that links to this file&rsquo;s
                address will show a broken image or a dead link.
              </>
            )}
          </Dialog.Description>

          {blocked && (
            <>
              <section
                aria-labelledby="usage-heading"
                className="mt-5 rounded-field border border-default bg-surface p-4"
              >
                <h3 id="usage-heading" className="text-body font-semibold text-primary">
                  Used as the cover of
                </h3>
                <ul className="mt-2 space-y-1 text-body">
                  {usage.map((post) => (
                    <li key={post.id}>
                      <a
                        href={`/admin/blog/${post.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-field break-words text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
                      >
                        {post.title}
                        <span className="sr-only"> (opens the post editor in a new tab)</span>
                      </a>{' '}
                      <span className="text-secondary">({post.status})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-label text-secondary">
                  This is a certain reference, not a guess: these posts store this image&rsquo;s id.
                  Drafts and archived posts count too.
                </p>
              </section>
              <div className="mt-6 flex justify-end">
                <Dialog.Close asChild>
                  <Button variant="secondary">Close</Button>
                </Dialog.Close>
              </div>
            </>
          )}

          {!blocked && (
            <>
              {/* On `surface`, not `background-alt`: the warning below is `text-error`, a verified pairing
              on surface (4.83 / 6.27) but only 4.41:1 on background-alt in light mode. */}
              <section
                aria-labelledby="scan-heading"
                className="mt-5 rounded-field border border-default bg-surface p-4"
              >
                <h3 id="scan-heading" className="text-body font-semibold text-primary">
                  Where might this be used?
                </h3>

                {/* Always mounted so a screen reader announces the result when the check finishes. */}
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 space-y-2 text-body text-primary"
                >
                  {scan.status === 'loading' && <p>Checking the places we know about…</p>}

                  {scan.status === 'error' && (
                    <p>
                      The check could not be run ({scan.message}). Nothing has been checked, so this
                      says nothing about whether the file is used. You can still delete it.
                    </p>
                  )}

                  {summary && scan.status === 'done' && (
                    <>
                      <p className="font-medium">{summary.headline}</p>

                      {scan.scan.matches.length > 0 && (
                        <>
                          <ul className="list-inside list-disc text-body break-words">
                            {scan.scan.matches.map((match) => (
                              <li key={`${match.source}:${match.where}`}>
                                <span className="font-medium">{match.source}</span>: {match.where}
                              </li>
                            ))}
                          </ul>
                          <p className="font-medium text-error">{SCAN_FOUND_WARNING}</p>
                        </>
                      )}

                      {summary.unchecked.length > 0 && (
                        <p>Could not be checked: {summary.unchecked.join(', ')}.</p>
                      )}

                      <p className="text-label text-secondary">{summary.caveat}</p>
                      <p className="text-label text-secondary">
                        Places checked:{' '}
                        {scan.scan.sources
                          .filter((source) => source.ok)
                          .map((source) => source.label)
                          .join(', ') || 'none'}
                        .
                      </p>
                    </>
                  )}
                </div>
              </section>

              <div className="mt-5">
                <label htmlFor={typedId} className="block text-label font-medium text-primary">
                  To confirm, type the file name exactly:{' '}
                  <span className="font-mono break-all text-primary">{media.filename}</span>
                </label>
                <Input
                  id={typedId}
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-describedby={`${typedId}-hint`}
                  className="mt-2"
                />
                <p id={`${typedId}-hint`} className="mt-1.5 text-label text-secondary">
                  Match capital letters and the extension. Pasting is fine.
                </p>
              </div>

              {matchCount > 0 && (
                <div className="mt-4 flex gap-3">
                  <Checkbox
                    id={ackId}
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                  <label htmlFor={ackId} className="text-body text-primary">
                    I understand this file may still be used in {matchCount}{' '}
                    {matchCount === 1 ? 'place' : 'places'} listed above, and that deleting it will
                    break {matchCount === 1 ? 'it' : 'them'}.
                  </label>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-field border border-error bg-surface px-4 py-3 text-body text-error"
                >
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Dialog.Close asChild>
                  <Button variant="secondary" aria-disabled={pending || undefined}>
                    Cancel, keep the file
                  </Button>
                </Dialog.Close>
                <Button
                  variant="secondary"
                  aria-disabled={!canDelete || undefined}
                  aria-describedby={blockedReason ? `${typedId}-blocked` : undefined}
                  className="border-error text-error not-disabled:hover:border-error aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                  onClick={() => void remove()}
                >
                  {pending ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </div>
              {blockedReason && (
                <p id={`${typedId}-blocked`} className="mt-2 text-right text-label text-secondary">
                  {blockedReason}
                </p>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
