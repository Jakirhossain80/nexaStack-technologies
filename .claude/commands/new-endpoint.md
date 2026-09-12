---
description: Scaffold a new Express API endpoint in the NexaStack house pattern
---

Create a new API endpoint: **$ARGUMENTS**

Follow `apps/api/CLAUDE.md` exactly. Do not invent a different structure.

## Deliverables

**1. Zod schema** — `packages/shared/src/schemas/<domain>.ts`
- Validates body, params or query as appropriate
- User-facing error messages that say what to do, not just what is wrong
- Export the inferred type: `export type XInput = z.infer<typeof xSchema>`
- Check whether a suitable schema already exists before writing a new one

**2. Mongoose model** (if this endpoint introduces a new collection) — `apps/api/src/models/`
- Schema-level validation in addition to Zod
- Indexes on slug (unique), status, and any field used for search or sort
- `select: false` on anything sensitive
- Timestamps enabled

**3. Service** — `apps/api/src/services/<domain>.service.ts`
- Pure business logic. Never touches `req`, `res` or `next`.
- Throws typed application errors, which the error handler maps to status codes

**4. Controller** — `apps/api/src/controllers/<domain>.controller.ts`
- Reads validated input, calls the service, returns the standard envelope
- No business logic

**5. Route** — `apps/api/src/routes/<domain>.routes.ts`
- Path and middleware attachment only
- Middleware in order: rate limiter (if public or auth) → auth → `requireRole` (if admin)
  → `validate(schema)` → controller

**6. OpenAPI annotation** — summary, params, request body, responses per status code,
auth requirement

**7. Tests** — schema unit tests and an integration test covering the success path,
a validation failure, and an authorisation failure

## Non-negotiable

- Response envelope: `{ success: true, data }` / `{ success: false, error: { code, message } }`
- Server-side validation always — client validation is not a substitute
- Never return a password hash, token, stack trace or Mongo error
- Never pass a raw user-supplied object into a Mongoose query
- Rate limit every public endpoint
- Pino log with the request id
- Explicit role check on every admin route — UI hiding is not authorisation

## Before finishing

1. Run `pnpm lint` and `pnpm typecheck`
2. State which role(s) may call this endpoint and why
3. Flag anything you had to assume
