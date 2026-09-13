# NexaStack Technologies

The website of NexaStack Technologies: a public marketing site and an admin interface, built as
a pnpm monorepo with a Next.js front end, an Express REST API and a shared validation package.

> **Status:** foundation only. The homepage is a temporary design-token proof sheet; no
> marketing pages, admin screens or features exist yet.

Project conventions, design tokens and rules live in [`CLAUDE.md`](./CLAUDE.md), with
app-specific rules in `apps/web/CLAUDE.md`, `apps/api/CLAUDE.md` and
`packages/shared/CLAUDE.md`. Read them before contributing.

## Prerequisites

| Tool    | Version                                                                           |
| ------- | --------------------------------------------------------------------------------- |
| Node.js | 22.12 or newer (developed on 22.23)                                               |
| pnpm    | 11.5.2 — pinned via `packageManager`; run `corepack enable` to use it             |
| MongoDB | A local MongoDB 7+ server or a MongoDB Atlas cluster                              |
| Network | `next build` downloads the Geist fonts from Google Fonts (self-hosted at runtime) |

Use **pnpm only**. Do not use npm or yarn; they ignore the workspace catalog and lockfile.

## Install

```bash
pnpm install
```

A `postinstall` step builds `packages/shared`, so both apps can import it immediately.

## Environment setup

Each app has its own environment file; there is no root `.env`. Copy each app's example and
fill in real values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

| App        | Example file            | Your local file       | Variables                                                                                |
| ---------- | ----------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web` | `apps/web/.env.example` | `apps/web/.env.local` | `NEXT_PUBLIC_SITE_URL` (required for production builds)                                  |
| `apps/api` | `apps/api/.env.example` | `apps/api/.env`       | `CORS_ORIGINS`, `MONGODB_URI` (required); `NODE_ENV`, `PORT`, `LOG_LEVEL`, `TRUST_PROXY` |

- Never commit `.env` files. Only the `.env.example` files are tracked.
- `NEXT_PUBLIC_*` variables are sent to the browser — never put a secret in one.
- The API validates its environment at startup and exits with a message naming every missing
  or invalid variable.
- Each `.env.example` lists only variables the code reads today. When a change starts reading
  a new variable, add it to that app's `.env.example` in the same change.

### Planned variables (not read by any code yet)

These come from the original project setup. None is in an `.env.example` yet; add each to the
app shown when the feature that uses it is built.

| App        | Variables                                                                                          | Feature                  |
| ---------- | -------------------------------------------------------------------------------------------------- | ------------------------ |
| `apps/web` | `NEXT_PUBLIC_API_URL`                                                                              | Calling the Express API  |
| `apps/web` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                                                   | Cloudflare Turnstile     |
| `apps/web` | `NEXT_PUBLIC_SENTRY_DSN`                                                                           | Browser error monitoring |
| `apps/api` | `JWT_SECRET`, `JWT_EXPIRES_IN`                                                                     | Auth                     |
| `apps/api` | `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`                                               | Session cookie           |
| `apps/api` | `BCRYPT_ROUNDS`                                                                                    | Password hashing (≥12)   |
| `apps/api` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` | Media uploads            |
| `apps/api` | `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_TO_ENQUIRIES`                              | Transactional email      |
| `apps/api` | `TURNSTILE_SECRET_KEY`                                                                             | Cloudflare Turnstile     |
| `apps/api` | `SENTRY_DSN`                                                                                       | API error monitoring     |

## Running

| Command                 | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `pnpm dev`              | Shared package (watch) + web on :3000 + API on :4000    |
| `pnpm --filter web dev` | Next.js only — http://localhost:3000                    |
| `pnpm --filter api dev` | Express only (tsx watch) — http://localhost:4000        |
| `pnpm build`            | Build shared, web and API                               |
| `pnpm lint`             | ESLint across all workspaces                            |
| `pnpm typecheck`        | Build shared, then `tsc --noEmit` across all workspaces |
| `pnpm test`             | Run workspace test suites (none exist yet)              |
| `pnpm format`           | Prettier write (`pnpm format:check` to verify only)     |

Run `pnpm lint` and `pnpm typecheck` before considering any change complete.

If you change `packages/shared` while running an app on its own (not via `pnpm dev`), rebuild
it with `pnpm build:shared`.

### API endpoints

| Method | Path              | Description                                              |
| ------ | ----------------- | -------------------------------------------------------- |
| GET    | `/health`         | Process liveness, no dependencies                        |
| GET    | `/health/ready`   | 200 when MongoDB is connected, otherwise 503             |
| POST   | `/api/v1/contact` | Example endpoint: rate limited, validated, not persisted |

Every response uses the envelope `{ "success": true, "data": … }` or
`{ "success": false, "error": { "code", "message", "details"? } }`.

```bash
curl -X POST http://localhost:4000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Ayesha Rahman","email":"ayesha@example.com","subject":"New website","message":"We need a new marketing site for our clinic."}'
```

## Project structure

```
.
├── apps/
│   ├── web/                      Next.js App Router (public site + admin UI)
│   │   ├── app/
│   │   │   ├── (marketing)/      public pages — currently the temporary token proof sheet
│   │   │   ├── (admin)/admin/    admin shell (auth guard to come)
│   │   │   ├── layout.tsx        fonts, metadata, pre-paint theme script, skip link
│   │   │   ├── sitemap.ts        generated from lib/routes.ts
│   │   │   └── robots.ts
│   │   ├── components/
│   │   │   ├── ui/               primitives (Button)
│   │   │   └── layout/           ThemeProvider, ThemeToggle
│   │   ├── config/company.ts     single source of company facts
│   │   ├── lib/                  cn, env, theme, routes
│   │   └── styles/
│   │       ├── tokens.css        raw colour values (the only file with hex colours)
│   │       └── globals.css       Tailwind v4 theme mapping, utilities, reduced motion
│   └── api/                      Express 5 REST API
│       └── src/
│           ├── index.ts          bootstrap, DB connection, graceful shutdown
│           ├── app.ts            middleware order
│           ├── config/env.ts     Zod-validated environment
│           ├── routes/           paths + middleware only
│           ├── controllers/      request/response shaping
│           ├── services/         business logic (no req/res)
│           ├── models/           Mongoose schemas (none yet)
│           ├── middleware/       validate, rate limit, 404, error handler
│           ├── lib/              logger, db, errors, response helpers
│           └── types/
├── packages/
│   └── shared/                   Zod schemas, inferred types, constants for both apps
│       └── src/{schemas,types,constants}/
├── eslint.config.mjs             single ESLint flat config for the monorepo
├── prettier.config.mjs
├── tsconfig.base.json            strict base extended by every workspace
└── pnpm-workspace.yaml           workspaces + version catalog
```

## Design tokens

Colours, type, radii and spacing from `CLAUDE.md` section 7 are exposed as Tailwind classes —
for example `bg-surface`, `text-secondary`, `border-default`, `bg-primary-blue`,
`text-on-primary`, `rounded-card`, `text-section`, `section-y` and `page-container`. Tailwind's
default colour palette and radius scale are removed, so components cannot drift from the
tokens. Open http://localhost:3000 to see every token in both themes.

## Deployment

Planned: Vercel (`apps/web`), Render (`apps/api`), MongoDB Atlas and Cloudinary. The domain,
Render tier and cookie strategy are open decisions — see `CLAUDE.md` section 22.

## Known gaps

### Graceful shutdown of the API is untested

`apps/api/src/index.ts` handles `SIGTERM` and `SIGINT` by closing the HTTP server, then the
MongoDB connection, with a 10-second forced exit. **This path has never been exercised.** The
foundation was developed on Windows, where `SIGTERM` is not delivered to Node processes the way
it is on Linux, so a real signal could not be sent.

It matters because Render sends `SIGTERM` on every redeploy and restart: this is the code that
decides whether in-flight requests (including contact submissions) complete or are cut off.

**Before the first deploy**, verify it on Linux — under WSL or in Docker:

1. Start the built API: `pnpm --filter api build && node apps/api/dist/index.js` (with
   `CORS_ORIGINS` and `MONGODB_URI` set).
2. Send `kill -TERM <pid>` while a request is in flight.
3. Confirm the logs show `Shutting down`, then `Shutdown complete`; the in-flight request
   completes; the process exits with code 0; and no forced-exit timeout is logged.
