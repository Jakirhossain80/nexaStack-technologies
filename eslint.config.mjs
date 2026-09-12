// Single ESLint flat config for the whole monorepo. Workspaces run `eslint .` and resolve
// this file by walking up from their directory.
import path from 'node:path';

import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const WEB_FILES = ['apps/web/**/*.{js,jsx,mjs,ts,tsx}'];

/** Scope config objects to apps/web, keeping any narrower file globs they already declare. */
const scopeToWeb = (configs) =>
  configs.map((config) => ({
    ...config,
    files: config.files
      ? config.files.map((glob) => (typeof glob === 'string' ? `apps/web/${glob}` : glob))
      : WEB_FILES,
  }));

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/out/**',
    '**/build/**',
    '**/coverage/**',
    '**/next-env.d.ts',
  ]),

  // Everything outside apps/web: JS + TypeScript recommended rules.
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ignores: WEB_FILES,
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },

  // apps/web: Next.js core-web-vitals + TypeScript rules (includes react, react-hooks,
  // jsx-a11y and import plugins).
  ...scopeToWeb([...nextVitals, ...nextTs]),
  {
    files: WEB_FILES,
    // Absolute: a relative rootDir resolves against the cwd, which differs per workspace.
    settings: { next: { rootDir: path.join(import.meta.dirname, 'apps/web') } },
  },

  // apps/api runs on Node.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Config files at any level run on Node.
  {
    files: ['**/*.config.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Shared rules for all TypeScript.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Must be last: turns off rules that conflict with Prettier.
  prettier,
]);
