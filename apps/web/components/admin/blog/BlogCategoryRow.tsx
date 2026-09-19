'use client';

import type { BlogCategoryAdmin } from '@nexastack/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDeleteButton } from '@/components/admin/content/ConfirmDeleteButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminRequest } from '@/lib/adminRequest';

export interface BlogCategoryRowProps {
  category: BlogCategoryAdmin;
  /** Zero-based position, and how many categories there are, for the move buttons and announcements. */
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
}

/** One category in the manager: its name and post count, rename, move up/down and delete. */
export function BlogCategoryRow({ category, index, total, busy, onMove }: BlogCategoryRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inUse = category.postCount > 0;
  const inputId = `category-name-${category.id}`;

  async function saveName() {
    setPending(true);
    setError(null);
    const result = await adminRequest('PATCH', `/api/v1/admin/blog/categories/${category.id}`, {
      name,
    });
    setPending(false);

    if (!result.ok) {
      const nameIssue = result.error.details?.find((detail) => detail.path === 'name');
      setError(nameIssue?.message ?? result.error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function cancelEdit() {
    setName(category.name);
    setError(null);
    setEditing(false);
  }

  return (
    <li className="px-4 py-4">
      {/* Side by side only from `lg`: four action buttons beside the name do not fit at tablet width. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div>
              <label htmlFor={inputId} className="block text-label font-medium text-primary">
                Category name
              </label>
              <Input
                id={inputId}
                value={name}
                invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 max-w-md"
              />
              {error && (
                <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-label text-error">
                  {error}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <Button disabled={pending} onClick={() => void saveName()}>
                  {pending ? 'Saving…' : 'Save name'}
                </Button>
                <Button variant="secondary" disabled={pending} onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-body font-medium text-primary">
                <span className="text-secondary">{index + 1}.</span> {category.name}
              </p>
              <p className="text-label text-secondary">
                <span className="font-mono">{category.slug}</span> · {category.postCount}{' '}
                {category.postCount === 1 ? 'post' : 'posts'}
              </p>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <Button
              variant="secondary"
              disabled={busy || index === 0}
              onClick={() => onMove(index, -1)}
              aria-label={`Move ${category.name} up`}
            >
              <span aria-hidden="true">↑</span> Up
            </Button>
            <Button
              variant="secondary"
              disabled={busy || index === total - 1}
              onClick={() => onMove(index, 1)}
              aria-label={`Move ${category.name} down`}
            >
              <span aria-hidden="true">↓</span> Down
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setEditing(true)}
              aria-label={`Rename ${category.name}`}
            >
              Rename
            </Button>
            <ConfirmDeleteButton
              url={`/api/v1/admin/blog/categories/${category.id}`}
              itemLabel="category"
              disabled={busy || inUse}
              label="Delete"
            />
          </div>
        )}
      </div>

      {!editing && inUse && (
        <p className="mt-3 text-label text-secondary">
          In use by {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}; move{' '}
          {category.postCount === 1 ? 'it' : 'them'} to another category to delete this one.
        </p>
      )}
    </li>
  );
}
