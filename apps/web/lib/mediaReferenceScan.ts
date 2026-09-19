/**
 * The pure core of the Media Library's "where might this be used?" hint. No imports on purpose: it
 * can be run and tested on its own, and it holds the ONE place the hint's wording is decided.
 *
 * WHAT THIS IS, AND IS NOT. The site has no system that records which content uses which image
 * (every config file just contains a URL string), so nothing here can KNOW whether a file is in use.
 * This walks the values it is given and reports the ones that mention the file. Not finding a mention
 * proves only that it was not in the places looked at: a URL written into a page component, an email
 * template or anywhere else is invisible to it. So the wording below states what was checked, and
 * never claims a file is "unused" or "safe to delete".
 */

const ID_CHARACTER = /[A-Za-z0-9_-]/;
const MAX_DEPTH = 12;
const MAX_MATCHES = 50;

/**
 * True if `text` contains `needle` as a whole path token: the character after it must not continue the
 * id (so `.../abc12` does not match a search for `.../abc1`), while `.png`, `?`, `)` or the end do.
 */
export function mentions(text: string, needle: string): boolean {
  if (needle === '') return false;
  let from = 0;
  for (;;) {
    const index = text.indexOf(needle, from);
    if (index === -1) return false;
    const next = text[index + needle.length];
    if (next === undefined || !ID_CHARACTER.test(next)) return true;
    from = index + 1;
  }
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Walks strings, arrays and plain objects, returning the path of every string that mentions
 * `needle` (for example `projects[1].screenshots[0].src`). Functions, class instances and React
 * elements are skipped; cycles and very deep values are cut off.
 */
export function findMentions(value: unknown, needle: string): string[] {
  const found: string[] = [];
  const seen = new WeakSet<object>();

  function walk(node: unknown, path: string, depth: number): void {
    if (found.length >= MAX_MATCHES || depth > MAX_DEPTH) return;

    if (typeof node === 'string') {
      if (mentions(node, needle)) found.push(path || '(top level)');
      return;
    }
    if (typeof node !== 'object' || node === null) return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      return;
    }
    if (!isPlainObject(node) || '$$typeof' in node) return;

    for (const [key, child] of Object.entries(node)) {
      walk(child, path ? `${path}.${key}` : key, depth + 1);
    }
  }

  walk(value, '', 0);
  return found;
}

/** One place that was looked at. `ok: false` means it could not be checked (for example the database was unreachable). */
export interface ScannedSource {
  label: string;
  ok: boolean;
}

export interface ReferenceMatch {
  /** Which place: `config/projects.ts`, `Blog posts`. */
  source: string;
  /** Where inside it: a value path, or a post title and field. */
  where: string;
}

export interface MediaReferenceScan {
  checkedAt: string;
  sources: ScannedSource[];
  matches: ReferenceMatch[];
}

export interface ScanSummary {
  /** The first sentence: what was found or not found, and how many places were checked. */
  headline: string;
  /** Always present. States plainly that this is a hint, not a guarantee. */
  caveat: string;
  /** Places that could not be checked, if any. */
  unchecked: string[];
  found: boolean;
}

export const SCAN_CAVEAT =
  'This check is best-effort. It looks in the site’s content settings and in blog posts (drafts included). ' +
  'It cannot see a URL written directly into a page component, an email template or anywhere else, so it does not guarantee that nothing uses this file.';

export const SCAN_FOUND_WARNING =
  'Deleting this file will break these. Check each one before you continue.';

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The hint's wording. "Unused" and "safe" are never used: at most, "no reference found". */
export function summarizeScan(scan: MediaReferenceScan): ScanSummary {
  const checkedCount = scan.sources.filter((source) => source.ok).length;
  const unchecked = scan.sources.filter((source) => !source.ok).map((source) => source.label);

  if (scan.matches.length > 0) {
    return {
      headline: `Found ${plural(scan.matches.length, 'possible reference', 'possible references')} in the ${plural(checkedCount, 'place', 'places')} checked.`,
      caveat: SCAN_CAVEAT,
      unchecked,
      found: true,
    };
  }

  const headline =
    checkedCount === 0
      ? 'Nothing could be checked, so no reference was looked for.'
      : `No reference found in the ${plural(checkedCount, 'place', 'places')} checked.`;
  return { headline, caveat: SCAN_CAVEAT, unchecked, found: false };
}
