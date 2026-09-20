import { Button } from '@/components/ui/Button';

export interface BlogUnavailableProps {
  /** The page to reload, e.g. `/blog` or `/blog/some-post`. */
  retryHref: string;
}

/**
 * What `/blog` and `/blog/[slug]` show when the published posts cannot be read (the database is
 * unreachable). The caller has already logged the real cause with `logBlogReadFailure`; this says
 * only that the content is temporarily unavailable, never why, and never invents posts. The caller
 * supplies the page heading.
 *
 * `loading.tsx` has already streamed a 200 by the time the read fails, so the status cannot be
 * changed, and a `<meta name="robots">` rendered here would land in `<body>`, after `<head>` has been
 * flushed. `/blog/[slug]` marks itself `noindex` through its (already async) `generateMetadata`;
 * `/blog` cannot without making its metadata async, which would move `<title>` out of `<head>` on the
 * healthy path too. So an outage is served as a 200 the crawler may briefly see; it self-corrects on the next crawl.
 */
export function BlogUnavailable({ retryHref }: BlogUnavailableProps) {
  return (
    <div className="mt-12 max-w-prose rounded-card border border-default bg-surface p-6 shadow-card md:p-8">
      <p className="text-body-lg text-primary">Articles are temporarily unavailable.</p>
      <p className="mt-2 text-body text-secondary">
        This is a problem on our side, not with your connection or your device. Please check back
        shortly.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href={retryHref} prefetch={false} variant="secondary" className="w-full sm:w-auto">
          Try again
        </Button>
        <Button href="/" variant="secondary" className="w-full sm:w-auto">
          Back to the homepage
        </Button>
      </div>
    </div>
  );
}
