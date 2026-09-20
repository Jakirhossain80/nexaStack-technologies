// Run manually, by the founder: `pnpm --filter api run backup-db`.
//
// A MANUAL, interim safety net: one compressed `mongodump` archive of the database named in
// MONGODB_URI, written to apps/api/backups/ (git-ignored). It is NOT an automated backup. Nothing runs it
// on a schedule, and it protects only what has been dumped at the moment it was run. MongoDB Atlas's free
// M0 tier offers no automated or continuous backups; real automated backups need a paid Atlas plan, which
// is a business decision, not something code can provide. See README.md, "Backups".
//
// Needs the MongoDB Database Tools (`mongodump`) on PATH: https://www.mongodb.com/try/download/database-tools
//
// The connection string contains the database password, so it is never put on the command line (where any
// process listing would show it). It is written to a temporary config file (mode 0600, deleted afterwards)
// and handed over with `--config`. mongodump's own output is passed through with the URI and the password
// redacted, in case an error message ever echoes them.
//
// RESTORE is deliberately not scripted (a restore can overwrite live data, so it should be typed by a
// person who has read what it will do). See README.md for the `mongorestore` command.

import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';

const BACKUP_DIR = fileURLToPath(new URL('../backups/', import.meta.url));

/** `20260920-131500`, in UTC, so archive names sort by time and never contain a colon. */
function timestamp(now: Date): string {
  return now
    .toISOString()
    .replace(/\.\d+Z$/, '')
    .replace(/[-:]/g, '')
    .replace('T', '-');
}

/** Every string that must never reach the terminal: the whole URI and the password inside it. */
function secretsIn(uri: string): string[] {
  const secrets = [uri];
  try {
    const { password } = new URL(uri);
    if (password) secrets.push(password, decodeURIComponent(password));
  } catch {
    // An unparseable URI was already rejected by config/env.ts; nothing more to redact.
  }
  return secrets.filter((secret) => secret.length > 0);
}

function redact(text: string, secrets: readonly string[]): string {
  return secrets.reduce((out, secret) => out.split(secret).join('[redacted]'), text);
}

/** A YAML double-quoted scalar. */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function main(): Promise<void> {
  await mkdir(BACKUP_DIR, { recursive: true });
  const archivePath = join(BACKUP_DIR, `nexastack-${timestamp(new Date())}.archive.gz`);

  const workDir = await mkdtemp(join(tmpdir(), 'nexastack-backup-'));
  const configPath = join(workDir, 'mongodump.yml');
  const secrets = secretsIn(env.MONGODB_URI);

  try {
    await writeFile(configPath, `uri: ${yamlString(env.MONGODB_URI)}\n`, { mode: 0o600 });

    const exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn('mongodump', [`--config=${configPath}`, '--gzip', `--archive=${archivePath}`], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const forward = (chunk: Buffer): void => {
        process.stderr.write(redact(chunk.toString(), secrets));
      };
      child.stdout.on('data', forward);
      child.stderr.on('data', forward);
      child.on('error', reject);
      child.on('close', (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      await rm(archivePath, { force: true });
      throw new Error(`mongodump exited with code ${exitCode}; no archive was kept.`);
    }

    const { size } = await stat(archivePath);
    if (size === 0) {
      await rm(archivePath, { force: true });
      throw new Error('mongodump produced an empty archive; it was removed.');
    }

    logger.info(
      { archive: archivePath, bytes: size },
      'Backup written. It contains client data and is NOT encrypted: copy it somewhere private and off this machine; it is not uploaded anywhere.',
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    logger.fatal(
      'mongodump was not found on PATH. Install the MongoDB Database Tools (https://www.mongodb.com/try/download/database-tools) and add their bin folder to PATH, then run this again.',
    );
  } else {
    logger.fatal({ err }, 'Backup failed.');
  }
  process.exitCode = 1;
});
