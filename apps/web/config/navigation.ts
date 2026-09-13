/**
 * Site navigation — the single source for every link list (desktop nav, mobile drawer, and later
 * the footer). Never hardcode these links in a component.
 */

export interface NavItem {
  label: string;
  href: `/${string}`;
  /**
   * Reserved for dropdown menus. Not rendered yet: the service and solution lists are an open
   * decision (root CLAUDE.md 22.10). Add children here and extend the renderers; the shape of
   * this config does not need to change.
   */
  children?: readonly NavItem[];
}

export const primaryNavigation: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Process', href: '/process' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export const navigationActions = {
  quote: { label: 'Get a Quote', href: '/quotation' },
} as const satisfies Record<string, NavItem>;
