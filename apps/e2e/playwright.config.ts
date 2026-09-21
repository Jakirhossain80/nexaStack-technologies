import { defineConfig, devices } from '@playwright/test';

import { WEB_URL } from './support/env';

/**
 * TWO TIERS, because running every test on every browser and device for every change is slow and is not free:
 *
 *   fast (default, `pnpm test:e2e`)        Chromium only: what to run before merging UI work.
 *   full (`pnpm test:e2e:full`)            + Firefox, WebKit (Safari's engine) and three device profiles
 *                                          (iPhone, Pixel, iPad): what to run before a release.
 *
 * Both boot the same real stack once (global-setup.ts). Nothing here can run against a deployed site.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: process.env['E2E_WORKERS'] ? Number(process.env['E2E_WORKERS']) : 4,
  reporter: [['list']],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome (Pixel 7)', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari (iPhone 14)', use: { ...devices['iPhone 14'] } },
    { name: 'tablet (iPad Mini)', use: { ...devices['iPad Mini'] } },
  ],
});
