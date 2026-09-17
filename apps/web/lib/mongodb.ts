import mongoose from 'mongoose';

import { serverEnv } from './env.server';

/**
 * Cached Mongoose connection for Route Handlers. Next.js reloads modules on every hot-reload
 * in development and can invoke a Route Handler concurrently in production, so the connection
 * (and the in-flight connect promise) is cached on `global` rather than a module-level variable
 * — a module-level variable would still be re-created on each hot reload, opening a new
 * connection every time a file changes.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __nexastackMongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = (global.__nexastackMongooseCache ??= { conn: null, promise: null });

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

/** Returns a connected Mongoose instance, reusing the existing connection when possible. */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(serverEnv.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
