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

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * The Express API's origin, for the CSP `connect-src`: the admin interface calls it directly from the
 * browser (`NEXT_PUBLIC_API_URL`, same variable `lib/env.ts` validates). Read here rather than imported
 * because next.config.ts runs before the `@/` alias exists. Null if unset or malformed, in which case
 * nothing extra is allowed (production builds fail earlier in `lib/env.ts` on a missing value).
 */
function apiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || (isProduction ? '' : 'http://localhost:4000');
  try {
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
}

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const CLOUDINARY_ORIGIN = 'https://res.cloudinary.com';
/**
 * `@vercel/speed-insights` loads `script.debug.js` from here, in development only. In production it
 * loads `/_vercel/speed-insights/script.js` from this site's own origin (already `'self'`) and reports
 * to `/_vercel/speed-insights/vitals`, also same-origin, so production needs no extra origin and
 * neither mode needs a `connect-src` entry (the package only uses `vitals.vercel-insights.com` when a
 * `dsn` prop is passed, which this site does not do).
 */
const VERCEL_SCRIPTS_ORIGIN = 'https://va.vercel-scripts.com';

/**
 * Content-Security-Policy, set as a STATIC header so every page stays statically rendered and CDN-cacheable.
 * The alternative, per-request nonces via a proxy, would force every page to render dynamically (Next.js
 * "Content Security Policy" guide). The trade-off that choice carries: `script-src` needs
 * `'unsafe-inline'` (the root layout has an inline theme script, and Next.js injects inline scripts), so
 * this policy does NOT stop an injected inline script. What it does enforce: scripts, frames and
 * connections only to this site, Cloudflare Turnstile and (for connect) the API; no plugins; no
 * `<base>` hijack; forms post only to this site; and the site cannot be framed. Stored-XSS in blog
 * bodies is covered separately, by the article-HTML allow-list (`ArticleBody`), not by this header.
 *
 * Development also needs `'unsafe-eval'` (React's debugging), websockets (HMR) and the Vercel Speed
 * Insights debug script's origin (see `VERCEL_SCRIPTS_ORIGIN`).
 */
function contentSecurityPolicy(): string {
  const api = apiOrigin();
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      TURNSTILE_ORIGIN,
      ...(isDevelopment ? ["'unsafe-eval'", VERCEL_SCRIPTS_ORIGIN] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', CLOUDINARY_ORIGIN],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(api ? [api] : []), TURNSTILE_ORIGIN, ...(isDevelopment ? ['ws:', 'wss:'] : [])],
    'frame-src': [TURNSTILE_ORIGIN],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
  // Legacy equivalent of `frame-ancestors 'none'`, for browsers that only read this one.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // HTTPS-only browsers remember the site. Production only, and deliberately WITHOUT
  // `includeSubDomains` or `preload`: the domain is not chosen yet (root CLAUDE.md 22.1), and both of
  // those are hard to undo once a domain has been submitted or its subdomains are affected.
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
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
