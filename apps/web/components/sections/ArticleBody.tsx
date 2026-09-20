import { findUnsafeArticleHtml } from '@nexastack/shared';

export interface ArticleBodyProps {
  contentHtml: string;
}

/**
 * Renders a post's stored `contentHtml`. That HTML is produced only by the API's markdown renderer
 * (`apps/api/src/lib/markdown.ts`), which escapes everything it does not write itself, and the API
 * refuses to store anything outside the article-HTML allow-list. This component applies the SAME check
 * (`findUnsafeArticleHtml`, one shared implementation) before injecting it, so the page does not trust
 * the database blindly: a value written straight into MongoDB, bypassing the API, is not injected.
 * It shows a plain fallback instead and logs the rule that failed (never the HTML itself).
 *
 * Styled entirely through the `article-prose` utility (globals.css), since `className` can't be
 * attached to individual tags inside injected HTML.
 */
export function ArticleBody({ contentHtml }: ArticleBodyProps) {
  const problem = findUnsafeArticleHtml(contentHtml);

  if (problem) {
    console.error(`[blog] Stored article HTML failed the allow-list check (${problem}); not rendered.`);
    return (
      <p role="status" className="text-secondary">
        This article can’t be displayed right now. Please check back soon.
      </p>
    );
  }

  return <div className="article-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}
