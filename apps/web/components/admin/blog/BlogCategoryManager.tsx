'use client';

import type { BlogCategoryAdmin } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BlogCategoryRow } from '@/components/admin/blog/BlogCategoryRow';
import { adminRequest } from '@/lib/adminRequest';
import { expireBlogCache } from '@/lib/expireBlogCache';

export interface BlogCategoryManagerProps {
  categories: readonly BlogCategoryAdmin[];
  /** `content:publish`: renaming and reordering change the live public blog, so they are publishing work. */
  canRearrange: boolean;
  /** `content:delete`. */
  canDelete: boolean;
}

/**
 * The ordered category list. Reordering is Move up / Move down buttons rather than drag and drop:
 * keyboard- and screen-reader-operable with no library, and each move is announced. The order is
 * saved as a whole (`PUT …/categories/order`) and is what the public `/blog` category filter shows.
 */
export function BlogCategoryManager({
  categories,
  canRearrange,
  canDelete,
}: BlogCategoryManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    const moved = categories[index];
    if (!moved || target < 0 || target >= categories.length) return;

    const orderedIds = categories.map((category) => category.id);
    orderedIds.splice(index, 1);
    orderedIds.splice(target, 0, moved.id);

    setBusy(true);
    setMessage(null);
    const result = await adminRequest('PUT', '/api/v1/admin/blog/categories/order', { orderedIds });
    setBusy(false);

    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error.message });
      // A 409 means the list changed elsewhere; reload so the screen matches the server.
      router.refresh();
      return;
    }
    // Category order decides the public filter order; expire the public cache (best-effort).
    await expireBlogCache();
    setMessage({
      kind: 'success',
      text: `Moved “${moved.name}” ${direction < 0 ? 'up' : 'down'}. It is now number ${target + 1} of ${categories.length}.`,
    });
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <p className="mt-8 text-body text-secondary">No categories yet. Add the first one above.</p>
    );
  }

  return (
    <div className="mt-8">
      <p
        role={message?.kind === 'error' ? 'alert' : 'status'}
        className={
          message?.kind === 'error'
            ? 'mb-3 text-body text-error'
            : message
              ? 'mb-3 text-body text-primary'
              : 'sr-only'
        }
      >
        {message?.text}
      </p>
      <ol
        aria-label="Blog categories, in display order"
        className="divide-y divide-default rounded-card border border-default bg-surface"
      >
        {categories.map((category, index) => (
          <BlogCategoryRow
            key={category.id}
            category={category}
            index={index}
            total={categories.length}
            busy={busy}
            canRearrange={canRearrange}
            canDelete={canDelete}
            onMove={(rowIndex, direction) => void move(rowIndex, direction)}
          />
        ))}
      </ol>
    </div>
  );
}
