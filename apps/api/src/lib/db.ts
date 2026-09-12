import { setTimeout as sleep } from 'node:timers/promises';

import mongoose from 'mongoose';

import { logger } from './logger.js';

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

// Wrap `$`-prefixed objects in query filters with `$eq`, so a user-supplied object such as
// `{ "$gt": "" }` cannot become a query operator (NoSQL injection). Models must still extract
// and coerce fields explicitly.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const retryAbort = new AbortController();

/**
 * Connection lifecycle logging. Attached only after the first successful connect: during the
 * initial retry loop these events duplicate the "connection failed" log for every attempt.
 */
function attachConnectionListeners(): void {
  mongoose.connection.on('disconnected', () => {
    if (!retryAbort.signal.aborted) logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err: Error) =>
    logger.error({ errName: err.name, errMessage: err.message }, 'MongoDB connection error'),
  );
}

/**
 * Connect to MongoDB, retrying with capped exponential backoff until it succeeds or shutdown
 * begins. Runs in the background so the HTTP server (and GET /health) starts immediately;
 * GET /health/ready reports 503 until the connection is up.
 */
export async function connectWithRetry(uri: string): Promise<void> {
  for (let attempt = 1; !retryAbort.signal.aborted; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
      attachConnectionListeners();
      logger.info({ attempt }, 'MongoDB connected');
      return;
    } catch (err) {
      const retryInMs = Math.min(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
      // Name and message only: never log the connection string.
      const { name, message } = err instanceof Error ? err : new Error(String(err));
      logger.error(
        { attempt, retryInMs, errName: name, errMessage: message },
        'MongoDB connection failed',
      );
      try {
        await sleep(retryInMs, undefined, { signal: retryAbort.signal });
      } catch {
        return; // Aborted by shutdown.
      }
    }
  }
}

/** Stop retrying and close the connection. Safe to call when never connected. */
export async function disconnectDatabase(): Promise<void> {
  retryAbort.abort();
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

/** Round-trip ping to the database server. Throws if unreachable. */
export async function pingDatabase(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection has no database handle');
  await db.admin().ping();
}
