import * as about from '@/config/about';
import * as caseStudies from '@/config/case-studies';
import * as company from '@/config/company';
import * as home from '@/config/content/home';
import * as developmentProcess from '@/config/development-process';
import * as faq from '@/config/faq';
import * as navigation from '@/config/navigation';
import * as processSteps from '@/config/process';
import * as projects from '@/config/projects';
import * as serviceDetails from '@/config/service-details';
import * as services from '@/config/services';
import * as solutionDetails from '@/config/solution-details';
import * as solutions from '@/config/solutions';
import * as technologies from '@/config/technologies';
import * as testimonials from '@/config/testimonials';
import {
  findMentions,
  mentions,
  type MediaReferenceScan,
  type ReferenceMatch,
  type ScannedSource,
} from '@/lib/mediaReferenceScan';
import { BlogPost } from '@/lib/models/BlogPost';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * The places the Media Library's best-effort "where might this be used?" hint looks. See
 * `lib/mediaReferenceScan.ts` for what that hint is and is not.
 *
 * CONFIG. Every file in `apps/web/config/` is a plain data module, and none of them records which
 * image it uses other than by holding a URL string. They are imported here (not read from disk: the
 * source files are not present in a deployed server) and every string value is checked. The list is
 * explicit, so a NEW config file is not scanned until it is added here. That is why the result always
 * names the places it checked, and why the wording never claims the file is unused.
 *
 * DATABASE. Blog posts are the only stored content that can hold an image address (`coverImage`, and
 * the markdown body). Drafts and archived posts count: they may be published later.
 *
 * NOT CHECKED, and said so to the admin: hand-written page and component code, email templates,
 * anything outside this list.
 */

interface ConfigSource {
  label: string;
  data: unknown;
}

export const CONFIG_SOURCES: readonly ConfigSource[] = [
  { label: 'config/about.ts', data: about },
  { label: 'config/case-studies.ts', data: caseStudies },
  { label: 'config/company.ts', data: company },
  { label: 'config/content/home.ts', data: home },
  { label: 'config/development-process.ts', data: developmentProcess },
  { label: 'config/faq.ts', data: faq },
  { label: 'config/navigation.ts', data: navigation },
  { label: 'config/process.ts', data: processSteps },
  { label: 'config/projects.ts', data: projects },
  { label: 'config/service-details.ts', data: serviceDetails },
  { label: 'config/services.ts', data: services },
  { label: 'config/solution-details.ts', data: solutionDetails },
  { label: 'config/solutions.ts', data: solutions },
  { label: 'config/technologies.ts', data: technologies },
  { label: 'config/testimonials.ts', data: testimonials },
];

const BLOG_SOURCE_LABEL = 'Blog posts (cover image and body, drafts included)';
const MAX_POSTS = 50;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function scanBlogPosts(publicId: string): Promise<{ ok: boolean; matches: ReferenceMatch[] }> {
  try {
    await connectToDatabase();

    // A cheap substring pre-filter in the database; the whole-token check below decides what counts.
    const pattern = new RegExp(escapeRegExp(publicId));
    const posts = await BlogPost.find({ $or: [{ coverImage: pattern }, { contentMarkdown: pattern }] })
      .select('title status coverImage contentMarkdown')
      .limit(MAX_POSTS)
      .lean();

    const matches: ReferenceMatch[] = [];
    for (const post of posts) {
      const name = `“${post.title}” (${post.status})`;
      if (post.coverImage && mentions(post.coverImage, publicId)) {
        matches.push({ source: 'Blog posts', where: `${name}, cover image` });
      }
      if (post.contentMarkdown && mentions(post.contentMarkdown, publicId)) {
        matches.push({ source: 'Blog posts', where: `${name}, body` });
      }
    }
    return { ok: true, matches };
  } catch {
    // The database being unreachable must not read as "nothing found": report it as not checked.
    return { ok: false, matches: [] };
  }
}

/**
 * Looks for the file's public id in the config modules and in blog posts. Never throws. A place that
 * could not be checked is reported as such (`ok: false`), not silently skipped.
 */
export async function scanMediaReferences(publicId: string): Promise<MediaReferenceScan> {
  const sources: ScannedSource[] = [];
  const matches: ReferenceMatch[] = [];

  for (const source of CONFIG_SOURCES) {
    sources.push({ label: source.label, ok: true });
    for (const path of findMentions(source.data, publicId)) {
      matches.push({ source: source.label, where: path });
    }
  }

  const blog = await scanBlogPosts(publicId);
  sources.push({ label: BLOG_SOURCE_LABEL, ok: blog.ok });
  matches.push(...blog.matches);

  return { checkedAt: new Date().toISOString(), sources, matches };
}
