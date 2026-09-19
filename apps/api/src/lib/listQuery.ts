import type { Paginated } from '@nexastack/shared';

/**
 * Helpers shared by every paginated, searchable admin list (blog posts today; the next content
 * type to earn full-CMS treatment reuses these).
 */

/**
 * Escape user text for use inside a `RegExp`. Search terms are matched as literal text, never as
 * a pattern — an unescaped `.*` or `(a+)+` from a query string would be a ReDoS and NoSQL-regex
 * injection vector (root CLAUDE.md 11.4).
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function skipFor(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
