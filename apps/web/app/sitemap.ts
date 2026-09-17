import type { MetadataRoute } from 'next';

import { getAllPosts } from '@/lib/blog';
import { env } from '@/lib/env';
import { PUBLIC_ROUTES } from '@/lib/routes';
import { caseStudies } from '@/config/case-studies';
import { projects } from '@/config/projects';
import { services } from '@/config/services';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic routes, each appended from its own real data source rather than a literal
  // PUBLIC_ROUTES entry — none of these are fixed URLs.

  // Every service has a detail page (services/[slug]/page.tsx builds all of `services`,
  // unfiltered).
  const serviceRoutes = services.map((service) => ({
    url: new URL(`/services/${service.slug}`, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Only projects with a real case study get a page — same intersection
  // `portfolio/[slug]/page.tsx`'s own `generateStaticParams` uses, so the sitemap never lists a
  // project that would actually 404.
  const projectSlugs = new Set(projects.map((project) => project.slug));
  const portfolioRoutes = caseStudies
    .filter((detail) => projectSlugs.has(detail.slug))
    .map((detail) => ({
      url: new URL(`/portfolio/${detail.slug}`, env.NEXT_PUBLIC_SITE_URL).toString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  // Currently empty (getAllPosts() returns []), so this adds nothing yet; each real post
  // appears here automatically once one exists.
  const postRoutes = getAllPosts().map((post) => ({
    url: new URL(`/blog/${post.slug}`, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...portfolioRoutes, ...postRoutes];
}
