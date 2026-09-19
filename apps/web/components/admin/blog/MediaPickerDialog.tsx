'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { MediaThumbnail } from '@/components/admin/media/MediaThumbnail';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { listMediaPickerAction, type PickerItem, type PickerResult } from '@/lib/mediaActions';

export interface MediaPickerDialogProps {
  /** The visible label of the button that opens the picker. */
  triggerLabel: string;
  /** The item currently chosen, marked in the grid. */
  currentId?: string | undefined;
  onPick: (item: PickerItem) => void;
  /** Passed to Radix so the caller can decide where focus goes after the dialog closes. */
  onCloseAutoFocus?: (event: Event) => void;
  className?: string;
  children?: ReactNode;
}

const SEARCH_DEBOUNCE_MS = 300;

/** A page of results, remembered with the request it answers, so "loading" is derived, not stored. */
interface Answer {
  key: string;
  result: PickerResult;
}

/**
 * Choose an image from the Media Library. Only JPG, PNG and WebP are offered (a blog cover is rendered
 * through `next/image`, which does not serve SVG; the API enforces it too). Each tile is a real
 * button: its name is the file's name (visible text, so the accessible name contains what is shown),
 * the image inside carries its own alt text, and the chosen one is marked with `aria-pressed`.
 * Radix provides the focus trap, Escape to close and focus return.
 *
 * Results are fetched by a Server Action when the dialog opens and as the search or page changes.
 */
export function MediaPickerDialog({
  triggerLabel,
  currentId,
  onPick,
  onCloseAutoFocus,
  className,
}: MediaPickerDialogProps) {
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refreshCount, setRefreshCount] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const key = `${query}|${page}|${refreshCount}`;

  // Debounce the search box into `query`. State is set from the timer callback, not on entry.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setQuery(typed.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, typed]);

  // Fetch whenever the dialog is open and the request changes. Only the answer to the CURRENT request
  // is used, so a slow response can never overwrite a newer one.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMediaPickerAction({ q: query, page })
      .then((result) => {
        if (!cancelled) setAnswer({ key, result });
      })
      .catch(() => {
        if (!cancelled) {
          setAnswer({ key, result: { ok: false, message: 'The images could not be loaded. Try again.' } });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, query, page, key]);

  const loading = answer?.key !== key;
  const result = loading ? null : answer.result;

  function choose(item: PickerItem) {
    onPick(item);
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          // Opening: start from a clean search.
          setTyped('');
          setQuery('');
          setPage(1);
          setAnswer(null);
        }
        setOpen(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="secondary" className={className}>
          {triggerLabel}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 z-50 max-h-11/12 w-11/12 max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-default bg-surface p-5 sm:p-6"
        >
          <Dialog.Title className="text-card font-semibold text-primary">
            Choose a cover image
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-body text-secondary">
            Images from the Media Library. JPG, PNG and WebP only. The image&rsquo;s alt text is copied
            into the post, where you can edit it.
          </Dialog.Description>

          <form
            role="search"
            aria-label="Search images"
            onSubmit={(event) => event.preventDefault()}
            className="mt-4"
          >
            <label htmlFor={searchId} className="block text-label font-medium text-primary">
              Search images
            </label>
            <Input
              id={searchId}
              type="search"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder="File name or alt text"
              className="mt-2"
            />
          </form>

          {/* Always mounted so a screen reader hears the result count when it changes. */}
          <p role="status" className="mt-4 text-label text-secondary">
            {loading
              ? 'Loading images…'
              : result?.ok
                ? result.total === 0
                  ? 'No images found.'
                  : `Showing ${result.items.length} of ${result.total} ${result.total === 1 ? 'image' : 'images'}.`
                : ''}
          </p>

          {result && !result.ok && (
            <p role="alert" className="mt-3 rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
              {result.message}
            </p>
          )}

          {result?.ok && result.items.length === 0 && (
            <div className="mt-3 space-y-3 text-body text-primary">
              <p>
                {query
                  ? 'Nothing matches that search.'
                  : 'The Media Library has no JPG, PNG or WebP images yet.'}
              </p>
              <p className="text-secondary">
                <a
                  href="/admin/media"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
                >
                  Upload images in the Media Library
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                , then press Refresh.
              </p>
              <Button variant="secondary" onClick={() => setRefreshCount((count) => count + 1)}>
                Refresh
              </Button>
            </div>
          )}

          {result?.ok && result.items.length > 0 && (
            <>
              <ul aria-label="Images" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {result.items.map((item) => {
                  const chosen = item.id === currentId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={chosen}
                        aria-label={`Use ${item.filename} as the cover image`}
                        onClick={() => choose(item)}
                        className={cn(
                          'flex h-full w-full flex-col overflow-hidden rounded-card border bg-surface text-left transition duration-150 ease-out hover:bg-surface-hover focus-ring',
                          chosen ? 'border-2 border-primary-blue' : 'border-default hover:border-default-hover',
                        )}
                      >
                        <MediaThumbnail
                          media={{ mediaType: 'image', url: item.url, altText: item.altText, filename: item.filename }}
                          sizes="(min-width: 40rem) 240px, 45vw"
                        />
                        <span className="flex flex-1 flex-col gap-1 p-3">
                          <span className="line-clamp-2 text-body font-medium break-words text-primary">
                            {item.filename}
                            {chosen && <span className="font-normal text-secondary"> (current)</span>}
                          </span>
                          {item.altText && (
                            <span className="line-clamp-2 text-label text-secondary">{item.altText}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {result.totalPages > 1 && (
                <nav aria-label="Image pages" className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    aria-disabled={result.page <= 1 || undefined}
                    className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    onClick={() => {
                      if (result.page > 1) setPage(result.page - 1);
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-label text-secondary">
                    Page {result.page} of {result.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    aria-disabled={result.page >= result.totalPages || undefined}
                    className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    onClick={() => {
                      if (result.page < result.totalPages) setPage(result.page + 1);
                    }}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
