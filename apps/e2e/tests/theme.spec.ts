import { expect, test, type Page } from '@playwright/test';

import { seedTheme } from '../support/helpers';

/**
 * Light, Dark and System, including the FLASH-PREVENTION check from the Theme task: a hard reload must never
 * paint the wrong theme first. The page's inline script must have set the right class on <html> before the
 * document finished parsing, and nothing may flip it afterwards. The observer below runs before any page
 * script (addInitScript), records every change to <html class>, and snapshots the class and the real computed
 * background colour at DOMContentLoaded, i.e. before hydration.
 */

interface ThemeLog {
  classChanges: string[];
  atDcl: string;
  bgAtDcl: string;
}

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const log = { classChanges: [] as string[], atDcl: '', bgAtDcl: '' };
    (window as unknown as { __themeLog: typeof log }).__themeLog = log;
    // Observe `document` (not `documentElement`): at init-script time the <html> element does not exist yet.
    new MutationObserver(() => log.classChanges.push(document.documentElement.className)).observe(
      document,
      { subtree: true, attributes: true, attributeFilter: ['class'] },
    );
    document.addEventListener('DOMContentLoaded', () => {
      log.atDcl = document.documentElement.className;
      log.bgAtDcl = getComputedStyle(document.body).backgroundColor;
    });
  });
}

const readLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { __themeLog: ThemeLog }).__themeLog);
const settledBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const isDark = (className: string) => /\bdark\b/.test(className);

const CASES: { stored: 'light' | 'dark' | 'system'; os: 'light' | 'dark'; expectDark: boolean }[] =
  [
    { stored: 'light', os: 'dark', expectDark: false }, // an explicit Light beats a dark OS
    { stored: 'dark', os: 'light', expectDark: true }, // an explicit Dark beats a light OS
    { stored: 'system', os: 'dark', expectDark: true },
    { stored: 'system', os: 'light', expectDark: false },
  ];

for (const path of ['/', '/contact']) {
  test.describe(`hard reload on ${path}`, () => {
    for (const { stored, os, expectDark } of CASES) {
      test(`stored "${stored}" with an OS set to ${os}: ${expectDark ? 'dark' : 'light'} from the first paint, no flip`, async ({
        page,
        browserName,
      }) => {
        // Verified with a probe: in Firefox, Playwright's emulateMedia set BEFORE navigation never reaches matchMedia (it stays
        // false even after load), so a cold load cannot be judged there. Explicit modes are unaffected, and 'System follows the
        // OS live' (below) passes on Firefox because it changes the emulation after load.
        test.skip(
          browserName === 'firefox' && stored === 'system',
          'Firefox: OS colour-scheme emulation is not applied to the first document',
        );
        await page.emulateMedia({ colorScheme: os });
        await seedTheme(page, stored);
        await instrument(page);

        await page.goto(path, { waitUntil: 'load' });
        await page.reload({ waitUntil: 'load' }); // the "hard reload": a second load with the choice already stored
        await expect(page.locator('h1').first()).toBeVisible();

        const log = await readLog(page);
        expect(
          isDark(log.atDcl),
          `class at DOMContentLoaded (before hydration) was "${log.atDcl}"`,
        ).toBe(expectDark);
        expect(isDark(await page.evaluate(() => document.documentElement.className))).toBe(
          expectDark,
        );
        expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe(
          expectDark ? 'dark' : 'light',
        );
        expect(
          await page.evaluate(() => document.documentElement.getAttribute('data-theme-preference')),
        ).toBe(stored);

        // No flash: nothing ever set the opposite theme, and the pre-hydration background is the settled one.
        for (const change of log.classChanges)
          expect(isDark(change), `<html class> was changed to "${change}"`).toBe(expectDark);
        expect(
          log.bgAtDcl,
          'background colour at DOMContentLoaded differs from the settled one (a flash)',
        ).toBe(await settledBackground(page));
      });
    }

    test('dark and light really are different colours (so the flash check above can fail)', async ({
      browser,
    }) => {
      const colours: string[] = [];
      for (const theme of ['dark', 'light'] as const) {
        const context = await browser.newContext({ colorScheme: 'light' });
        const other = await context.newPage();
        await seedTheme(other, theme);
        await other.goto(path);
        colours.push(await settledBackground(other));
        await context.close();
      }
      expect(colours[0]).not.toBe(colours[1]);
    });
  });
}

test.describe('the theme script, in the real page', () => {
  test('is inline in <head>, before the body starts (so it runs before first paint)', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    const script = html.indexOf('nexastack-theme');
    expect(script, 'the inline theme script is missing').toBeGreaterThan(-1);
    expect(script).toBeLessThan(html.indexOf('<body'));
  });

  test('blocked storage still follows the OS preference', async ({ page, browserName }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox: OS colour-scheme emulation is not applied to the first document',
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error('storage blocked');
      };
    });
    await instrument(page);
    await page.goto('/', { waitUntil: 'load' });
    expect(isDark((await readLog(page)).atDcl)).toBe(true);
  });
});

test.describe('choosing a theme in the interface (desktop header menu)', () => {
  const openMenu = async (page: Page) => {
    await page.getByRole('button', { name: /Change theme/ }).click();
  };
  const pick = async (page: Page, name: 'Light' | 'Dark' | 'System') => {
    await openMenu(page);
    await page.getByRole('menuitemradio', { name }).click();
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1024,
      'below the desktop breakpoint the toggle lives in the mobile drawer',
    );
  });

  test('Dark, then Light, then System: each is applied, remembered, and survives a reload', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await pick(page, 'Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => window.localStorage.getItem('nexastack-theme'))).toBe('dark');
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await pick(page, 'Light');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await pick(page, 'System'); // the OS is light
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/dark/); // and now it follows the OS, live
  });

  test('the menu is keyboard operable: Enter opens it, arrows choose, Escape closes and returns focus', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: /Change theme/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('an explicit choice ignores later OS changes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await pick(page, 'Light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(300);
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('System follows the OS live', () => {
  test('changing the OS preference switches the page with no reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await seedTheme(page, 'system');
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
