import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last item — it renders as the current page, not a link. */
  href?: `/${string}`;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
}

const SEPARATOR = (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-secondary">
    <path d="M7.5 5 12.5 10 7.5 15" />
  </svg>
);

/**
 * Visible breadcrumb nav — the WAI-ARIA "breadcrumb" pattern: a `nav` landmark labelled
 * "Breadcrumb", an ordered list, and the current page marked with `aria-current="page"` instead
 * of being a link. `about/page.tsx` and the services listing page only emit `BreadcrumbList`
 * JSON-LD; this is the first visible rendering of it, so it lives in `ui/` for reuse by future
 * detail pages (portfolio, solutions, blog) rather than being specific to services.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-label text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && SEPARATOR}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className="text-primary">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-field text-secondary focus-ring hover:text-primary-blue-hover"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
