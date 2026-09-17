import { cn } from '@/lib/cn';

export interface ArticleTableOfContentsProps {
  items: readonly { id: string; text: string; level: 2 | 3 }[];
}

/**
 * Plain anchor-link list — no scroll-spy, no client component. A link changing the browser's
 * scroll position via its own `href="#id"` needs no JavaScript; every heading in `article-prose`
 * (globals.css) carries `scroll-margin-top` so the sticky header never covers the target.
 */
export function ArticleTableOfContents({ items }: ArticleTableOfContentsProps) {
  if (items.length === 0) return null;

  const list = (
    <ul className="flex flex-col gap-2 border-l border-default pl-4 text-body text-secondary">
      {items.map((item) => (
        <li key={item.id} className={cn(item.level === 3 && 'pl-4')}>
          <a href={`#${item.id}`} className="rounded-field focus-ring hover:text-primary-blue-hover">
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav aria-label="Table of contents">
      {/* Mobile/tablet: collapsible disclosure, no JS needed — native <details>. */}
      <details className="rounded-card border border-default bg-surface p-4 lg:hidden">
        <summary className="cursor-pointer text-label font-semibold text-primary">
          Table of contents
        </summary>
        <div className="mt-4">{list}</div>
      </details>

      {/* Desktop: always-visible sticky sidebar. */}
      <div className="hidden lg:sticky lg:top-24 lg:block">
        <p className="text-label font-semibold text-primary">Table of contents</p>
        <div className="mt-4">{list}</div>
      </div>
    </nav>
  );
}
