export function findMongod(): string | null;
export function assertSafeTestUri(uri: string): void;
export function startMongod(): Promise<{
  /** Server URI with no database name: append `/<name>_test`. */
  uri: string;
  port: number;
  dbPath: string;
  stop: () => Promise<void>;
}>;
