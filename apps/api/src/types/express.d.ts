// Values parsed by the validate() middleware. Read them through the typed accessors in
// middleware/validate.ts rather than directly.
declare global {
  namespace Express {
    interface Locals {
      validated?: Partial<Record<'body' | 'params' | 'query', unknown>>;
    }
  }
}

export {};
