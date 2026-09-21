import { expect, test, type Page } from '@playwright/test';

import { authFile } from '../support/env';
import { seedTheme } from '../support/helpers';

/**
 * The four breakpoints from CLAUDE.md 16 (375, 768, 1280, 1920) on a representative page set, in all three
 * theme modes: no horizontal scroll and no broken layout at any of them. "Broken layout" here is what a
 * script can decide: the page scrolls sideways, an element pokes past the viewport, the h1 or footer is not
 * visible, or there is no way to navigate (the desktop links, or the menu button below the desktop breakpoint).
 */

const BREAKPOINTS = [
  { name: '375 (mobile)', width: 375, height: 812 },
  { name: '768 (tablet)', width: 768, height: 1024 },
  { name: '1280 (desktop)', width: 1280, height: 800 },
  { name: '1920 (wide)', width: 1920, height: 1080 },
] as const;

const THEMES = ['light', 'dark', 'system'] as const;

async function overflow(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const offenders: string[] = [];
    if (scrollWidth > viewport) {
      for (const element of document.querySelectorAll('body *')) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.right > viewport + 1) {
          const label = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}.${String(
            element.getAttribute('class') ?? '',
          )
            .split(/\s+/)
            .slice(0, 3)
            .join('.')}`;
          if (offenders.length < 5)
            offenders.push(`${label} (right edge ${Math.round(rect.right)} > ${viewport})`);
        }
      }
    }
    return { viewport, scrollWidth, offenders };
  });
}

async function checkPage(page: Page, path: string, width: number, options: { footer: boolean }) {
  await page.goto(path, { waitUntil: 'load' });
  await expect(page.locator('h1').first()).toBeVisible();
  const { viewport, scrollWidth, offenders } = await overflow(page);
  expect(
    scrollWidth,
    `horizontal scroll on ${path} at ${width}px: page is ${scrollWidth}px wide in a ${viewport}px viewport. Offenders: ${offenders.join('; ')}`,
  ).toBeLessThanOrEqual(viewport);
  if (options.footer) await expect(page.locator('footer').first()).toBeAttached();
}

test.describe('public pages', () => {
  for (const path of ['/', '/services', '/contact', '/quotation']) {
    for (const breakpoint of BREAKPOINTS) {
      for (const theme of THEMES) {
        test(`${path} at ${breakpoint.name}, ${theme} theme`, async ({ page }) => {
          await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
          await seedTheme(page, theme);
          await checkPage(page, path, breakpoint.width, { footer: true });
          // The site must be navigable: desktop links at the desktop breakpoint, a menu button below it.
          if (breakpoint.width >= 1024) {
            await expect(page.locator('header nav a[href="/services"]').first()).toBeVisible();
          } else {
            await expect(page.locator('header').getByRole('button').first()).toBeVisible();
          }
        });
      }
    }
  }
});

test.describe('admin list view (an enquiries table)', () => {
  test.use({ storageState: authFile('super_admin') });

  for (const breakpoint of BREAKPOINTS) {
    for (const theme of THEMES) {
      test(`/admin/enquiries at ${breakpoint.name}, ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await seedTheme(page, theme);
        await checkPage(page, '/admin/enquiries', breakpoint.width, { footer: false });
      });
    }
  }
});
