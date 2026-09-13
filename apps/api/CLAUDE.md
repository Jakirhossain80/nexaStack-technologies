# CLAUDE.md — apps/api

Express REST API for NexaStack Technologies.
Root `CLAUDE.md` applies first. This file adds API-specific rules.

---

## 1. Structure

```
src/
├── app.ts                # createApp(): builds and exports the app, middleware order
├── index.ts              # starts the server: env check, listen, DB connect, graceful shutdown
├── config/               # env parsing (validated with Zod at startup)
├── routes/               # path definitions + middleware attachment ONLY
├── controllers/          # parse request, call service, shape response
├── services/             # business logic — no req/res
├── models/               # Mongoose schemas
├── middleware/           # auth, rbac, rateLimit, validate, errorHandler
├── lib/                  # mailer, cloudinary, logger, swagger
└── types/
```

**Strict layering.** Controllers must not contain business logic. Services must never
touch `req`, `res` or `next`. A route file that contains logic is wrong.

---

## 2. Middleware order in `app.ts`

The app is split across two files:

- **`app.ts`** builds and exports the app (`createApp()`), and owns the middleware order
  below. It does not listen on a port.
- **`index.ts`** starts the server: validates the environment, calls `createApp()`, listens,
  connects to MongoDB and handles graceful shutdown.

This split lets tests import `createApp()` without binding a port. Never call `listen` in
`app.ts`, and never register middleware in `index.ts`.

```
helmet
cors (explicit origin allowlist, credentials: true)
cookie-parser
pino-http (request id)
express.json (with size limit)
rate limiters (per-route)
routes
404 handler
error handler (last, 4-arg signature)
```

Order matters. The error handler is always last. `pino-http` runs before `express.json` so
that a request rejected by the body parser (malformed JSON, body too large) still carries a
request id in its log line and `X-Request-Id` response header.

---

## 3. Response envelope

Every endpoint, without exception:

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation failed |
| 401 | Not authenticated |
| 403 | Authenticated but not permitted |
| 404 | Not found |
| 409 | Conflict (duplicate slug, duplicate email) |
| 429 | Rate limited |
| 500 | Server error |

**Never return a stack trace, a Mongo error, or an internal message to the client.** Log
the detail with Pino including the request id; return a safe generic message.

---

## 4. Validation

Zod schemas are imported from `packages/shared` — the same schemas the web app uses.

A `validate(schema)` middleware parses `body`, `params` and `query` before the controller
runs. The controller receives typed, validated data and does not re-check it.

Client validation is convenience. **This is the security boundary.**

---

## 5. Auth

- bcrypt, cost factor ≥12
- JWT signed with a secret from the environment, short-lived
- Delivered in an HTTP-only, `Secure`, `SameSite` cookie — never in a response body,
  never in `localStorage`
- Refresh/expiry strategy defined explicitly; logout invalidates

### RBAC

Roles: `super_admin`, `admin`, `content_editor`.

Enforced by `requireRole(...roles)` middleware **on the route**. Hiding a button in the UI
is not authorisation. Every admin route carries an explicit role requirement.

| Role | Permissions |
|---|---|
| `super_admin` | Everything, including user management |
| `admin` | All content, enquiries, quotations, media |
| `content_editor` | Blog and portfolio content only |

### Audit log

Write an entry for: login, failed login, user creation/role change, content publish/delete,
media delete, settings change. Record actor id, action, target, timestamp, IP.

---

## 6. Cookies and CORS

The session cookie requires the web app and API to share a registrable domain
(`nexastack.example` / `api.nexastack.example`) so `SameSite=Lax` works.

If they end up on different sites (`*.vercel.app` + `*.onrender.com`), the cookie needs
`SameSite=None; Secure`, CORS `credentials: true` with an explicit origin — and Safari's
tracking prevention will still break it intermittently.

**Raise this rather than working around it.** CORS origin is never `*` when credentials
are enabled.

---

## 7. Database

- Mongoose schemas with schema-level validation in addition to Zod
- Indexes on: slugs (unique), search fields, content status, submission timestamps
- `select: false` on password hashes and tokens — never returned by a query
- `.lean()` for read-only queries
- **Never pass a raw user-supplied object into a query** — NoSQL injection. Extract and
  coerce fields explicitly.
- Soft-delete content rather than hard-deleting where history matters

---

## 8. Contact and quotation endpoints

These are public and therefore the most exposed surface:

- Cloudflare Turnstile verification server-side before processing
- `express-rate-limit` per IP
- Zod validation
- Persist to MongoDB first, then send email — a failed email must not lose the enquiry
- Send both a notification to the firm and a confirmation to the sender
- Attachments: validate MIME type and size server-side, store in Cloudinary, never trust
  the client-reported type
- Log every submission with a request id

### Rate limiting

- Contact: **10 requests per IP per 15 minutes** (`middleware/rateLimit.ts`). Do not lower it
  without evidence: carrier-grade NAT is common in Bangladesh, so an office or a mobile network
  can put many genuine users behind one IP address.
- Every rejection is logged at `warn` with the client IP and the endpoint, so we can see
  whether the limit is ever actually reached.
- **The store is in-memory: per-process, and reset on every restart.** That is acceptable for
  a single Render instance only. It must be moved to a shared store (e.g. Redis) before the
  API runs on more than one instance, or each instance enforces its own separate limit.
- `TRUST_PROXY` must match the number of proxy hops in production, or every request appears
  to come from the proxy's IP and all clients share one limit.

---

## 9. Security checklist per endpoint

- [ ] Zod validation on body, params, query
- [ ] Auth middleware if not public
- [ ] `requireRole` if admin
- [ ] Rate limit if public or auth-related
- [ ] CSRF strategy applied for cookie-authenticated mutations
- [ ] No sensitive fields in the response
- [ ] Errors handled, nothing internal leaked
- [ ] Pino log with request id
- [ ] OpenAPI annotation

---

## 10. Logging

Pino, structured, with a request id on every line.

**Never log:** passwords, tokens, cookies, full request bodies of auth endpoints, API keys.

`info` for requests and business events, `warn` for handled problems, `error` for failures
with the error object attached.

---

## 11. Health checks

- `GET /health` — process liveness, no dependencies
- `GET /health/ready` — verifies the database connection

Used by the uptime monitor and by Render.

---

## 12. API documentation

Every route annotated for OpenAPI/Swagger: summary, params, request body schema, responses
per status code, auth requirement. Swagger UI served in non-production only.

---

## 13. Do not

- Put business logic in a controller or a route file
- Touch `req`/`res` in a service
- Return a password hash, token or internal error
- Use `*` as a CORS origin with credentials
- Trust a client-supplied MIME type, file size, role or user id
- Write a Zod schema here that duplicates one in `packages/shared`
- Skip the rate limiter on a public endpoint
- Log a secret
