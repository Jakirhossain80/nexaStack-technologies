import type { Metadata } from 'next';

import { ArticleBody } from '@/components/sections/ArticleBody';
import { ArticleGrid } from '@/components/sections/ArticleGrid';
import { ArticleHeader } from '@/components/sections/ArticleHeader';
import { ArticleTableOfContents } from '@/components/sections/ArticleTableOfContents';
import { ShareLinks } from '@/components/sections/ShareLinks';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { company } from '@/config/company';
import type { BlogPost, BlogPostDetail } from '@/lib/blog';
import { computeReadingTime } from '@/lib/blog';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';

// Dev-only route, not linked from anywhere on the site — same treatment as /dev/tokens,
// /dev/testimonials-preview and /dev/blog-preview. Excluded from the sitemap (never added to
// lib/routes.ts PUBLIC_ROUTES) and from indexing (noindex below, and "/dev" is already in
// lib/routes.ts DISALLOWED_PATHS for robots.txt). Separate from /dev/blog-preview since this
// exercises the article DETAIL template's components, not the listing page's.
//
// The fixture below is defined in THIS FILE ONLY, never in lib/blog.ts, which must stay
// stubbed until CLAUDE.md section 22 item 3's content-source decision is made. Title and body
// are deliberately, obviously fictional ("Sample Article...", placeholder sentences explaining
// their own purpose) — the one genuinely real thing in it is the author byline, which reuses
// the real founder identity from config/company.ts, per honesty note 1.

export const metadata: Metadata = {
  title: 'Blog article template preview (dev only)',
  robots: { index: false, follow: false },
};

const FIXTURE_CONTENT_HTML = `
<p>This is a sample article used only to verify the blog article detail template's layout and behavior. Every sentence in this fixture is deliberately generic placeholder text, not a real article about a real topic — it exists purely to exercise headings, links, lists, and code blocks against real rendering logic before any actual blog content exists.</p>

<h2 id="getting-started">Getting Started</h2>
<p>Getting started with any new project usually means confirming the basics first: which tools are installed, how the repository is structured, and what conventions the codebase already follows before writing a single new line.</p>
<ul>
<li>Item one</li>
<li>Item two</li>
<li>Item three</li>
</ul>

<h3 id="setting-up-your-environment">Setting Up Your Environment</h3>
<p>A short checklist helps here: install the right Node version, run the package manager's install command, copy the example environment file, and confirm the local server actually starts before changing anything.</p>
<pre><code class="language-typescript">function greet(name: string): string {
  return \`Hello, \${name}!\`;
}</code></pre>

<h2 id="wrapping-up">Wrapping Up</h2>
<p>None of this reflects a real workflow — it only demonstrates that headings render at the right levels, that the table of contents links resolve correctly, and that a code block stays readable in both light and dark themes. For more on how we build things, see the <a href="/services">services page</a>.</p>
`.trim();

const FIXTURE_POST: BlogPostDetail = {
  slug: 'sample-article-template-preview',
  title: 'Sample Article: A Placeholder Headline for Template Testing',
  excerpt:
    'A fixture-only article used to verify the detail template renders correctly before any real post exists.',
  category: 'Web Development',
  tags: ['Sample', 'Next.js'],
  coverImage: '/brand/nexastack-mark.png',
  coverImageAlt:
    'The NexaStack Technologies mark, used here only to prove the image path renders — not a real cover photo.',
  publishedAt: '2026-02-10',
  author: { name: company.founder.name, role: company.founder.jobTitle },
  contentHtml: FIXTURE_CONTENT_HTML,
  tableOfContents: [
    { id: 'getting-started', text: 'Getting Started', level: 2 },
    { id: 'setting-up-your-environment', text: 'Setting Up Your Environment', level: 3 },
    { id: 'wrapping-up', text: 'Wrapping Up', level: 2 },
  ],
  readingTimeMinutes: computeReadingTime(FIXTURE_CONTENT_HTML),
};

const RELATED_FIXTURES: readonly BlogPost[] = [
  {
    slug: 'sample-related-post-one',
    title: 'Sample Related Post One',
    excerpt:
      'A second fixture, used only to verify the related-articles section renders a real grid.',
    category: 'Web Development',
    tags: ['Sample'],
    publishedAt: '2026-01-20',
  },
  {
    slug: 'sample-related-post-two',
    title: 'Sample Related Post Two',
    excerpt: 'A third fixture, sharing a tag with the main preview article.',
    category: 'Design',
    tags: ['Sample', 'Next.js'],
    publishedAt: '2026-01-05',
  },
];

interface ThemePanelProps {
  mode: 'light' | 'dark';
}

function ThemePanel({ mode }: ThemePanelProps) {
  const canonicalUrl = `${env.NEXT_PUBLIC_SITE_URL}/blog/sample-article-template-preview`;

  return (
    <div className={cn(mode, 'rounded-card border border-default bg-background p-5 md:p-8')}>
      <p className="mb-6 font-mono text-label text-secondary">
        {mode === 'light' ? 'Light theme' : 'Dark theme'}
      </p>

      <ArticleHeader post={FIXTURE_POST} />

      <div className="mt-6">
        <ShareLinks url={canonicalUrl} title={FIXTURE_POST.title} />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_16rem]">
        <div className="order-2 max-w-prose lg:order-1">
          <ArticleBody contentHtml={FIXTURE_POST.contentHtml} />
        </div>
        <div className="order-1 lg:order-2">
          <ArticleTableOfContents items={FIXTURE_POST.tableOfContents} />
        </div>
      </div>

      <div className="mt-12 max-w-4xl border-t border-default pt-10">
        <h2 className="text-section font-semibold tracking-tight text-primary">Related articles</h2>
        <ArticleGrid posts={RELATED_FIXTURES} />
      </div>

      <div className="mt-12 max-w-prose border-t border-default pt-10">
        <h2 className="text-section font-semibold tracking-tight text-primary">
          Building something for your business?
        </h2>
        <p className="mt-4 text-body-lg text-secondary">
          Tell {company.legalName} what you&rsquo;re building and get a project-specific quote.
        </p>
        <Button href="/quotation" className="mt-6">
          Request a Quote
        </Button>
      </div>
    </div>
  );
}

export default function BlogPostPreviewPage() {
  return (
    <div className="page-container space-y-10 section-y">
      <header className="space-y-6">
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-card border border-error bg-surface p-4"
        >
          <span className="rounded-field border border-error px-2 py-0.5 font-mono text-label font-semibold text-error">
            DEV ONLY
          </span>
          <p className="text-body">
            Layout preview for the Blog article detail template, using fixture data defined in this
            file only. <code className="font-mono">lib/blog.ts</code> stays stubbed — see{' '}
            <code className="font-mono">apps/web/CLAUDE.md</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-prose">
            <h1 className="text-page font-semibold tracking-tight">
              Blog article template preview
            </h1>
            <p className="mt-3 text-body-lg text-secondary">
              One obviously fictional fixture article exercising the title, byline (real founder
              identity, fictional everything else), computed reading time, featured image, table of
              contents, article body with a code block, share links and related articles — rendered
              in both themes.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="space-y-10">
        <ThemePanel mode="light" />
        <ThemePanel mode="dark" />
      </div>
    </div>
  );
}
