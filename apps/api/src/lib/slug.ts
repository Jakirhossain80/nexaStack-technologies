/** Lowercase ASCII words joined by single hyphens. Accents are folded ("café" → "cafe"). */
export function slugify(text: string, fallback = 'item'): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

const SLUG_MAX_LENGTH = 100;
/** Room left for a `-<n>` suffix inside the 100-character slug limit. */
const SUFFIX_ROOM = 10;

/**
 * `base`, or `base-2`, `base-3`… — the first one `exists` reports as free. Used to derive a
 * slug from a title. A slug the author typed explicitly is NOT passed through this: a clash
 * there is reported as a 409 instead, so the author's chosen URL is never silently changed.
 */
export async function findFreeSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = base.slice(0, SLUG_MAX_LENGTH - SUFFIX_ROOM).replace(/-+$/g, '') || 'item';
  if (!(await exists(root))) return root;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }
  // Practically unreachable; fail loudly rather than loop forever.
  throw new Error(`Could not find a free slug for "${root}"`);
}
