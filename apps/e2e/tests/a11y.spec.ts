import { expect, test, type Page } from '@playwright/test';

import { authFile } from '../support/env';
import { publicPaths, runAxe, seedTheme } from '../support/helpers';

/**
 * axe-core (WCAG 2.1 A/AA rules) across the whole route inventory, in both colour themes, plus the admin
 * pages. AUTOMATED RULE CHECKS ONLY: axe finds a real but partial set of problems (roughly a third of WCAG
 * failures) and this suite says NOTHING about screen-reader behaviour: no assistive technology was used and
 * none is claimed. Rule results do not depend on the browser engine, so this runs once (Chromium).
 */

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'axe rule results do not vary by engine; run once',
);

async function assertNoViolations(page: Page, label: string) {
  const violations = await runAxe(page);
  const report = violations.map(
    (violation) =>
      `  [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes} node(s), e.g. ${violation.targets.join(' | ')})`,
  );
  expect(violations, `${label}\n${report.join('\n')}`).toEqual([]);
}

test.describe('public pages: light theme', () => {
  test('no axe violations on any public page', async ({ page, request }) => {
    test.setTimeout(300_000);
    await seedTheme(page, 'light');
    const failures: string[] = [];
    for (const path of await publicPaths(request)) {
      await page.goto(path, { waitUntil: 'load' });
      const violations = await runAxe(page);
      for (const violation of violations) {
        failures.push(
          `${path} [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes}x, e.g. ${violation.targets.join(' | ')})`,
        );
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

test.describe('public pages: dark theme', () => {
  test('no axe violations on the representative pages', async ({ page }) => {
    test.setTimeout(180_000);
    await seedTheme(page, 'dark');
    const failures: string[] = [];
    for (const path of [
      '/',
      '/about',
      '/services',
      '/services/business-websites',
      '/solutions',
      '/technologies',
      '/process',
      '/blog',
      '/faq',
      '/contact',
      '/quotation',
      '/privacy-policy',
    ]) {
      await page.goto(path, { waitUntil: 'load' });
      await expect(page.locator('html')).toHaveClass(/dark/);
      for (const violation of await runAxe(page)) {
        failures.push(
          `${path} [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes}x, e.g. ${violation.targets.join(' | ')})`,
        );
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

test.describe('admin pages (signed in as super_admin)', () => {
  test.use({ storageState: authFile('super_admin') });

  for (const theme of ['light', 'dark'] as const) {
    test(`no axe violations on the admin screens, ${theme} theme`, async ({ page }) => {
      test.setTimeout(240_000);
      await seedTheme(page, theme);
      const failures: string[] = [];
      for (const path of [
        '/admin',
        '/admin/enquiries',
        '/admin/quotations',
        '/admin/blog',
        '/admin/blog/new',
        '/admin/blog/categories',
        '/admin/media',
        '/admin/users',
        '/admin/activity',
        '/admin/change-password',
      ]) {
        await page.goto(path, { waitUntil: 'load' });
        await expect(page.locator('h1').first()).toBeVisible();
        for (const violation of await runAxe(page)) {
          failures.push(
            `${path} [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes}x, e.g. ${violation.targets.join(' | ')})`,
          );
        }
      }
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
});

test.describe('signed-out admin screens', () => {
  test('login, forgot-password and reset-password have no axe violations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    for (const path of [
      '/admin/login',
      '/admin/forgot-password',
      '/admin/reset-password?token=x',
    ]) {
      await page.goto(path, { waitUntil: 'load' });
      await assertNoViolations(page, path);
    }
    await context.close();
  });
});
