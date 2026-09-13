/** Strip trailing slashes, keeping the root as "/". */
function normalise(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Whether a nav link should be marked as the current page. The homepage matches only exactly;
 * any other link also matches its nested routes (/services/web-development → /services), but
 * not a sibling that merely shares a prefix (/servicesx).
 */
export function isActivePath(pathname: string, href: string): boolean {
  const current = normalise(pathname);
  const target = normalise(href);

  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}
