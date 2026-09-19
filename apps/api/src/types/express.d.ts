import type { AuthenticatedAdmin } from '@nexastack/shared';

// Values parsed by the validate() middleware. Read them through the typed accessors in
// middleware/validate.ts rather than directly.
declare global {
  namespace Express {
    interface Locals {
      validated?: Partial<Record<'body' | 'params' | 'query', unknown>>;
    }

    interface Request {
      /** Set by middleware/requireSession.ts once the session cookie is verified. */
      admin?: AuthenticatedAdmin;
      /** The session id embedded in the verified JWT — needed by logout to revoke it. */
      sessionId?: string;
    }
  }
}

export {};
