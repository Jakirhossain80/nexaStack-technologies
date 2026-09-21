// Starts a THROWAWAY mongod for the integration tests, and refuses anything that could reach real data.
//
// The integration tests write synthetic records (Test User, test@example.com, ...) and delete them. They must
// never be able to touch Atlas or a developer's own database, so this module is the only way the tests get a
// connection string, and `assertSafeTestUri` is called again by each test harness before it connects:
//
//   - the host must be loopback (127.0.0.1, localhost or ::1), and
//   - the database name must end in `_test`.
//
// It never reads `.env*` files. The instance lives in a temp directory that is deleted on stop.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const STARTUP_TIMEOUT_MS = 60_000;

/** Where a mongod might be, in the order to try. `MONGOD_BIN` wins so CI or another OS can point at its own. */
export function findMongod() {
  const candidates = [];
  if (process.env.MONGOD_BIN) candidates.push(process.env.MONGOD_BIN);

  const pathDirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs)
    candidates.push(path.join(dir, process.platform === 'win32' ? 'mongod.exe' : 'mongod'));

  if (process.platform === 'win32') {
    const root = path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'MongoDB', 'Server');
    if (existsSync(root)) {
      const versions = readdirSync(root).sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      );
      for (const version of versions)
        candidates.push(path.join(root, version, 'bin', 'mongod.exe'));
    }
  }

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * Throws unless `uri` is a loopback MongoDB URI naming a database that ends in `_test`.
 * Call it before every connection the tests make.
 */
export function assertSafeTestUri(uri) {
  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new Error('Refusing to run: the test MongoDB URI is not a valid URL.');
  }
  if (url.protocol !== 'mongodb:') {
    throw new Error(
      'Refusing to run: the test database must use a plain mongodb:// URI (never mongodb+srv, i.e. Atlas).',
    );
  }
  const loopback = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
  if (!loopback.has(url.hostname)) {
    throw new Error(
      `Refusing to run: the test database host must be loopback, got "${url.hostname}".`,
    );
  }
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run: the test database name must end in "_test", got "${dbName || '(none)'}".`,
    );
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

/** Starts mongod on a free loopback port with a temp data directory. Resolves once it accepts connections. */
export async function startMongod() {
  const binary = findMongod();
  if (!binary) {
    throw new Error(
      'The integration tests need a local MongoDB server (mongod) and none was found. Install MongoDB Community Server, ' +
        'or set MONGOD_BIN to the mongod executable. They deliberately do not fall back to any hosted database.',
    );
  }

  const dbPath = mkdtempSync(path.join(os.tmpdir(), 'nexastack-test-mongod-'));
  const port = await freePort();
  const child = spawn(
    binary,
    [
      '--dbpath',
      dbPath,
      '--port',
      String(port),
      '--bind_ip',
      '127.0.0.1',
      '--wiredTigerCacheSizeGB',
      '0.25',
    ],
    { stdio: 'ignore', windowsHide: true },
  );

  let exited = false;
  child.once('exit', () => {
    exited = true;
  });

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (!(await canConnect(port))) {
    if (exited) throw new Error('mongod exited during startup.');
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`mongod did not accept connections within ${STARTUP_TIMEOUT_MS / 1000}s.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  async function stop() {
    if (!exited) {
      const closed = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await Promise.race([closed, new Promise((resolve) => setTimeout(resolve, 10_000))]);
    }
    // Windows can hold data files for a moment after the process ends.
    rmSync(dbPath, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  }

  return { uri: `mongodb://127.0.0.1:${port}`, port, dbPath, stop };
}
