import type { NextConfig } from 'next';

/**
 * Blog cover images come from the Media Library, so they are Cloudinary URLs, and `next/image` only
 * loads a remote host that is registered here (root CLAUDE.md / apps/web CLAUDE.md 8). The
 * registration is for THIS account's images only (`/<cloud name>/image/upload/…`), not all of
 * res.cloudinary.com, so the site's image optimiser cannot be used to resize other people's images.
 *
 * The cloud name is read from the same server variable the upload route uses. It must be set in the
 * environment at BUILD and run time; if it is not, nothing is registered and a Cloudinary cover will not
 * render (a site-path cover, from `public/`, is unaffected).
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const SAFE_CLOUD_NAME = /^[A-Za-z0-9_-]+$/;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `next dev` would otherwise append a managed block to apps/web/CLAUDE.md, which is a
  // hand-maintained project specification.
  agentRules: false,
  images: {
    remotePatterns:
      cloudName && SAFE_CLOUD_NAME.test(cloudName)
        ? [
            {
              protocol: 'https',
              hostname: 'res.cloudinary.com',
              pathname: `/${cloudName}/image/upload/**`,
            },
          ]
        : [],
  },
};

export default nextConfig;
