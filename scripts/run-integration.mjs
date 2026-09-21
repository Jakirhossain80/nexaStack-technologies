// Runs the integration tier: starts ONE throwaway mongod, hands its URI to each workspace's `*.itest.ts`
// files through NEXASTACK_TEST_MONGO_URI, then always stops and deletes it.
//
//   pnpm test:integration                run everything
//   pnpm test:integration rbac csrf      only files whose path contains one of the words
//
// Each test file makes its own `<random>_test` database on that server, so files can run in parallel.

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { startMongod } from './lib/mongod.mjs';

const root = path.resolve(import.meta.dirname, '..');
const filters = process.argv.slice(2);

const WORKSPACES = [
  { name: 'api', dir: path.join(root, 'apps', 'api'), tests: path.join('src', 'integration') },
  { name: 'web', dir: path.join(root, 'apps', 'web'), tests: 'integration' },
];

function findTests(workspace) {
  const dir = path.join(workspace.dir, workspace.tests);
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.itest.ts'))
    .map((entry) => path.join(workspace.tests, entry.name))
    .filter((file) => filters.length === 0 || filters.some((word) => file.includes(word)));
}

function run(workspace, files, env) {
  return new Promise((resolve) => {
    console.log(`\n=== ${workspace.name}: ${files.length} integration file(s) ===`);
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', '--test', '--test-reporter=spec', ...files],
      {
        cwd: workspace.dir,
        env,
        stdio: 'inherit',
      },
    );
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const mongod = await startMongod();
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await mongod.stop();
}
process.on('SIGINT', () => shutdown().finally(() => process.exit(130)));
process.on('SIGTERM', () => shutdown().finally(() => process.exit(143)));

let failed = false;
try {
  console.log(`Throwaway mongod on ${mongod.uri} (temp dir deleted when done)`);
  const env = { ...process.env, NEXASTACK_TEST_MONGO_URI: mongod.uri };
  let ran = 0;
  for (const workspace of WORKSPACES) {
    const files = findTests(workspace);
    if (files.length === 0) continue;
    ran += files.length;
    if ((await run(workspace, files, env)) !== 0) failed = true;
  }
  // A run that executed nothing must never look like a pass (a mistyped filter would otherwise go green).
  if (ran === 0) {
    console.error(
      `\nNo integration test file matched${filters.length ? ` ${JSON.stringify(filters)}` : ''}.`,
    );
    failed = true;
  }
} finally {
  await shutdown();
}

process.exit(failed ? 1 : 0);
