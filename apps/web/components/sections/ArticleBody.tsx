export interface ArticleBodyProps {
  contentHtml: string;
}

/**
 * Renders pre-rendered, trusted `contentHtml` (see `BlogPostDetail`'s doc comment in
 * `lib/blog.ts` — sanitized/authored at build time by whichever real pipeline gets chosen).
 * Styled entirely through the `article-prose` utility (globals.css), since `className` can't be
 * attached to individual tags inside injected HTML.
 */
export function ArticleBody({ contentHtml }: ArticleBodyProps) {
  return <div className="article-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}
