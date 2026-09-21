import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { APIRequestContext, Page } from '@playwright/test';

import { STATE_FILE, WEB_URL, authFile, type E2eState, type Role } from './env';

/** Public, indexable static routes (mirrors `PUBLIC_ROUTES` in apps/web/lib/routes.ts, which has its own unit test). */
export const STATIC_ROUTES = [
  '/',
  '/about',
  '/services',
  '/solutions',
  '/portfolio',
  '/technologies',
  '/process',
  '/blog',
  '/faq',
  '/testimonials',
  '/contact',
  '/quotation',
  '/privacy-policy',
  '/terms-and-conditions',
] as const;

export const state = (): E2eState => JSON.parse(readFileSync(STATE_FILE, 'utf8')) as E2eState;

/** The `name=value` session cookie global setup created for a role, for server-side calls made by a test. */
export function cookieFor(role: Role): string {
  const file = JSON.parse(readFileSync(authFile(role), 'utf8')) as {
    cookies: { name: string; value: string }[];
  };
  const cookie = file.cookies[0]!;
  return `${cookie.name}=${cookie.value}`;
}

/** Every URL in the app's OWN sitemap, as paths: the route inventory for the dynamic pages comes from the site itself. */
export async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const response = await request.get('/sitemap.xml');
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]!);
    return `${url.pathname}${url.search}`.replace(/(.)\/$/, '$1');
  });
}

/** Static routes plus every dynamic page the sitemap lists (services, solutions, case studies, published posts). */
export async function publicPaths(request: APIRequestContext): Promise<string[]> {
  const fromSitemap = await sitemapPaths(request);
  return [...new Set<string>([...STATIC_ROUTES, ...fromSitemap])];
}

/**
 * Waits until React has attached to the page's form. Without it a fast automated "user" can type before
 * hydration, and the field values are then wiped (or the form submits natively): a race real WebKit/iOS runs hit,
 * that says nothing about the form's logic.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    return Boolean(form && Object.keys(form).some((key) => key.startsWith('__reactProps')));
  });
}

export const isDesktop = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 1024;

const axeSource = readFileSync(
  createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
  'utf8',
);

export interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: number;
  targets: string[];
}

/**
 * Sections below the fold are `opacity: 0` until they scroll into view (the site's ScrollReveal), and axe cannot
 * judge the colour of text that is not yet visible. Scroll the whole page once so every section is in its final,
 * visible state before the rules run; otherwise the contrast rule reports on a mid-animation page.
 */
export async function revealEverything(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
}

/**
 * Runs axe-core (the WCAG 2.1 A/AA rule set) in the page. AUTOMATED RULE CHECKS ONLY: this finds a real subset of
 * accessibility problems and proves nothing about a screen reader. No assistive technology was used.
 */
export async function runAxe(page: Page): Promise<AxeViolation[]> {
  await revealEverything(page);
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: object,
          ) => Promise<{
            violations: {
              id: string;
              impact: string | null;
              help: string;
              nodes: { target: unknown[] }[];
            }[];
          }>;
        };
      }
    ).axe;
    const results = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
    }));
  });
}

/** Sets the stored theme BEFORE any page script runs (so the inline theme script sees it on first load). */
export async function seedTheme(page: Page, theme: 'light' | 'dark' | 'system'): Promise<void> {
  await page.addInitScript((value) => {
    try {
      if (value === 'system') window.localStorage.removeItem('nexastack-theme');
      else window.localStorage.setItem('nexastack-theme', value);
    } catch {
      /* storage blocked */
    }
  }, theme);
}

export const abs = (path: string): string => new URL(path, WEB_URL).toString();
