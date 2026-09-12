import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { DISALLOWED_PATHS } from '@/lib/routes';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: new URL('/sitemap.xml', env.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
