import { expect, test } from '@playwright/test';

import { publicPaths } from '../support/helpers';

/**
 * LINK CONSTRUCTION ONLY. This sweeps every `wa.me`, `tel:` and `mailto:` link the site really renders, on every
 * public page, and checks each is well formed and carries the right number and message. It cannot complete a
 * WhatsApp conversation (that happens inside a third-party app); the URL is as far as automation can go.
 */

const NUMBER = '8801712119253';
const PREFILLED =
  'Hello NexaStack Technologies, I would like to discuss a web development project.';

test('every WhatsApp, telephone and email link on every public page is well formed', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const findings: string[] = [];
  const seen = { chat: 0, share: 0, tel: 0, mailto: 0 };

  for (const path of await publicPaths(request)) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.$$eval(
      'a[href*="wa.me"], a[href^="tel:"], a[href^="mailto:"]',
      (anchors) => anchors.map((a) => a.getAttribute('href') ?? ''),
    );
    for (const href of new Set(hrefs)) {
      const where = `${path}: ${href}`;
      if (href.startsWith('tel:')) {
        seen.tel++;
        if (href !== `tel:+${NUMBER}`) findings.push(`${where} is not the company number`);
      } else if (href.startsWith('mailto:')) {
        seen.mailto++;
        if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href))
          findings.push(`${where} is not a plain mailto address`);
      } else {
        const url = new URL(href);
        if (url.protocol !== 'https:' || url.hostname !== 'wa.me')
          findings.push(`${where} is not https://wa.me`);
        const text = url.searchParams.get('text');
        if (url.pathname === `/${NUMBER}`) {
          seen.chat++;
          // A chat with NexaStack: digits only (no "+", no leading zero), at most a `text` parameter, no fragment.
          if ([...url.searchParams.keys()].some((key) => key !== 'text'))
            findings.push(`${where} carries an unexpected query parameter`);
          if (url.hash) findings.push(`${where} carries a fragment`);
          if (text !== null && text !== PREFILLED)
            findings.push(`${where} prefilled message is ${JSON.stringify(text)}`);
        } else if (url.pathname === '/') {
          // The generic share-intent link (share a blog post with someone else): no number, but a message with the URL.
          seen.share++;
          if (!path.startsWith('/blog/'))
            findings.push(`${where} is a share link outside a blog post`);
          if (!text || !text.includes('http'))
            findings.push(`${where} share text should include the article URL`);
        } else {
          findings.push(`${where} points at an unexpected number`);
        }
        if (/\s/.test(href)) findings.push(`${where} contains a raw space`);
        // The classic mistake: keeping the domestic trunk 0 after the country code (880 + 01712119253), or a stray plus.
        if (href.includes('88001712119253') || href.startsWith('https://wa.me/+'))
          findings.push(`${where} has a malformed country code`);
      }
    }
  }

  expect(seen.chat, 'the WhatsApp chat link should appear on the site').toBeGreaterThan(5);
  expect(seen.tel).toBeGreaterThan(0);
  expect(seen.mailto).toBeGreaterThan(0);
  expect(findings, findings.join('\n')).toEqual([]);
});

test('the floating WhatsApp widget opens the prefilled chat', async ({ page }) => {
  await page.goto('/');
  const link = page.locator(`a[href^="https://wa.me/${NUMBER}"]`).first();
  await expect(link).toHaveAttribute(
    'href',
    `https://wa.me/${NUMBER}?text=${encodeURIComponent(PREFILLED)}`,
  );
});
