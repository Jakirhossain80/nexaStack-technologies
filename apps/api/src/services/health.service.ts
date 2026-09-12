import { isDatabaseConnected, pingDatabase } from '../lib/db.js';
import { ServiceUnavailableError } from '../lib/errors.js';

export interface Liveness {
  status: 'ok';
  uptimeSeconds: number;
}

export interface Readiness {
  status: 'ready';
  database: 'connected';
}

const NOT_READY_MESSAGE = 'The service is not ready yet. Please try again shortly.';

/** Process liveness. No dependencies are checked. */
export function getLiveness(): Liveness {
  return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
}

/** Readiness: the database connection is open and answers a ping. */
export async function getReadiness(): Promise<Readiness> {
  if (!isDatabaseConnected()) throw new ServiceUnavailableError(NOT_READY_MESSAGE);

  try {
    await pingDatabase();
  } catch (cause) {
    throw new ServiceUnavailableError(NOT_READY_MESSAGE, { cause });
  }

  return { status: 'ready', database: 'connected' };
}
