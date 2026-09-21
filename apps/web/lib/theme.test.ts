import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import vm from 'node:vm';

import {
  DARK_MEDIA_QUERY,
  THEMES,
  THEME_PREFERENCE_ATTRIBUTE,
  THEME_STORAGE_KEY,
  isTheme,
  themeInitScript,
} from '@/lib/theme';

/**
 * The inline script the root layout runs in <head>, BEFORE first paint, so the right theme is on <html>
 * before any content renders (no flash). It is executed here, as real JavaScript, in a sandbox that
 * stands in for the browser. This is the logic half of the flash-prevention check; the real-browser half
 * (hard reload, no light frame) is in the Playwright suite.
 */

interface Browser {
  stored?: string | null;
  storageThrows?: boolean;
  prefersDark?: boolean;
  matchMediaThrows?: boolean;
}

function runInitScript(browser: Browser) {
  const classes = new Set<string>();
  const attributes: Record<string, string> = {};
  const style: Record<string, string> = {};
  const mediaQueries: string[] = [];

  const documentElement = {
    classList: {
      toggle(name: string, force: boolean) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
    },
    style,
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
  };

  const window = {
    localStorage: {
      getItem(key: string) {
        if (browser.storageThrows) throw new Error('storage blocked');
        return key === THEME_STORAGE_KEY ? (browser.stored ?? null) : null;
      },
    },
    matchMedia(query: string) {
      mediaQueries.push(query);
      if (browser.matchMediaThrows) throw new Error('matchMedia unavailable');
      return { matches: Boolean(browser.prefersDark) };
    },
  };

  const sandbox = vm.createContext({ window, document: { documentElement } });
  vm.runInContext(themeInitScript, sandbox); // must never throw, whatever the browser does

  return {
    dark: classes.has('dark'),
    colorScheme: style['colorScheme'],
    preference: attributes[THEME_PREFERENCE_ATTRIBUTE],
    mediaQueries,
  };
}

describe('themeInitScript', () => {
  describe('the three theme modes', () => {
    it('Light: stored "light" is light even when the OS prefers dark', () => {
      const result = runInitScript({ stored: 'light', prefersDark: true });
      assert.equal(result.dark, false);
      assert.equal(result.colorScheme, 'light');
      assert.equal(result.preference, 'light');
    });

    it('Dark: stored "dark" is dark even when the OS prefers light', () => {
      const result = runInitScript({ stored: 'dark', prefersDark: false });
      assert.equal(result.dark, true);
      assert.equal(result.colorScheme, 'dark');
      assert.equal(result.preference, 'dark');
    });

    it('System: nothing stored follows the OS: dark when it prefers dark', () => {
      const result = runInitScript({ stored: null, prefersDark: true });
      assert.equal(result.dark, true);
      assert.equal(result.colorScheme, 'dark');
      assert.equal(result.preference, 'system');
    });

    it('System: nothing stored follows the OS: light when it prefers light', () => {
      const result = runInitScript({ stored: null, prefersDark: false });
      assert.equal(result.dark, false);
      assert.equal(result.colorScheme, 'light');
      assert.equal(result.preference, 'system');
    });

    it('System: an explicitly stored "system" behaves like nothing stored', () => {
      assert.equal(runInitScript({ stored: 'system', prefersDark: true }).dark, true);
      assert.equal(runInitScript({ stored: 'system', prefersDark: false }).dark, false);
    });

    it('asks the OS with the shared media query, and only when it needs to', () => {
      assert.deepEqual(runInitScript({ stored: null }).mediaQueries, [DARK_MEDIA_QUERY]);
      assert.deepEqual(
        runInitScript({ stored: 'dark' }).mediaQueries,
        [],
        'an explicit choice needs no OS query',
      );
      assert.deepEqual(runInitScript({ stored: 'light' }).mediaQueries, []);
    });
  });

  describe('bad or hostile storage', () => {
    it('an unrecognised stored value is treated as "system"', () => {
      for (const stored of ['purple', '', 'DARK', '<script>', 'null']) {
        const result = runInitScript({ stored, prefersDark: true });
        assert.equal(result.preference, 'system', JSON.stringify(stored));
        assert.equal(result.dark, true, JSON.stringify(stored));
      }
    });

    it('blocked storage still applies the OS preference (the regression this script once had)', () => {
      const dark = runInitScript({ storageThrows: true, prefersDark: true });
      assert.equal(dark.dark, true);
      assert.equal(dark.colorScheme, 'dark');
      assert.equal(dark.preference, 'system');
      const light = runInitScript({ storageThrows: true, prefersDark: false });
      assert.equal(light.dark, false);
      assert.equal(light.colorScheme, 'light');
    });

    it('fails silently if even matchMedia is unavailable (the page must still render)', () => {
      const result = runInitScript({ stored: null, matchMediaThrows: true });
      assert.equal(result.dark, false);
    });
  });

  it('is dependency-free ES5: no arrow functions, let/const, template literals or imports', () => {
    assert.doesNotMatch(themeInitScript, /=>|\blet\b|\bconst\b|`|\bimport\b|\basync\b/);
  });
});

describe('theme constants', () => {
  it('the three modes are light, dark and system, and isTheme accepts exactly those', () => {
    assert.deepEqual([...THEMES], ['light', 'dark', 'system']);
    for (const theme of THEMES) assert.equal(isTheme(theme), true);
    for (const bad of ['Light', '', 'auto', null, undefined, 1, {}])
      assert.equal(isTheme(bad), false);
  });
});
