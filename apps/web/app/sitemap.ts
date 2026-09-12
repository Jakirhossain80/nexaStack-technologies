import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { PUBLIC_ROUTES } from '@/lib/routes';

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, env.NEXT_PUBLIC_SITE_URL).toString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
