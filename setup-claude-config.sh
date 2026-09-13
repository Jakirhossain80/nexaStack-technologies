#!/usr/bin/env bash
# NexaStack Technologies - Claude Code configuration bootstrap
# Run once from the ROOT of your project directory:  bash setup-claude-config.sh
set -euo pipefail

echo "Creating Claude Code configuration for NexaStack Technologies..."

mkdir -p apps/web apps/api packages/shared .claude/commands

cat > 'CLAUDE.md' <<'NEXASTACK_EOF_0'
# CLAUDE.md — NexaStack Technologies

Project context for Claude Code. Read this fully before making changes.

`AGENTS.md` is a symlink to this file. Edit only `CLAUDE.md`.

---

## 1. Project overview

**NexaStack Technologies** is a founder-led web development firm based in Dhaka,
Bangladesh. This repository is the firm's own website: a public marketing site plus an
admin interface for managing content, enquiries and quotation requests.

The site is both a business asset and a demonstration of the firm's technical ability.
Code quality, accessibility and performance are therefore part of the product, not
optional polish.

**Tagline:** We Build Better Websites
**Positioning:** A capable founder-led development firm. The copy and design must never
imply a large corporation or a team that does not exist.

---

## 2. Golden rules

1. **Follow the design tokens in section 7 exactly.** Never invent a colour, radius or
   spacing value. If a needed token is missing, ask before adding it.
2. **Never redesign parts of the UI you were not asked to change.** Targeted changes only.
3. **Never add a dependency without asking first.** State what it is, why the existing
   stack cannot do it, and its size.
4. **Validation schemas live in `packages/shared` and are imported by both apps.** Never
   duplicate a schema.
5. **Accessibility requirements in section 14 are non-negotiable**, not a later pass.
6. **Preserve existing functionality.** When editing a file, change what was asked and
   leave the rest alone.
7. **Ask before any destructive operation** — deleting files, rewriting migrations,
   force-pushing, dropping collections.
8. Use **plan mode for any change spanning more than two files.**

---

## 3. Repository structure

pnpm workspace monorepo.

```
nexastack/
├── CLAUDE.md                    # this file (canonical)
├── AGENTS.md                    # symlink → CLAUDE.md
├── README.md                    # installation and deployment
├── pnpm-workspace.yaml
├── .claude/
│   ├── settings.json            # committed permissions
│   └── commands/                # custom slash commands
├── apps/
│   ├── web/                     # Next.js App Router (public site + admin UI)
│   │   ├── app/
│   │   │   ├── (marketing)/     # public route group
│   │   │   ├── (admin)/         # admin route group, auth-guarded
│   │   │   ├── api/             # Route Handlers (see 6.2 for what belongs here)
│   │   │   ├── layout.tsx
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── components/
│   │   │   ├── ui/              # primitives: Button, Card, Input, Badge
│   │   │   ├── sections/        # page sections: Hero, ServicesGrid, CTABand
│   │   │   ├── layout/          # Navbar, Footer, ThemeToggle
│   │   │   └── admin/           # admin-only components
│   │   ├── lib/                 # client utilities, fetchers, helpers
│   │   ├── config/
│   │   │   └── company.ts       # single source for company facts (section 4)
│   │   └── styles/
│   └── api/                     # Express REST API
│       └── src/
│           ├── routes/          # route definitions only
│           ├── controllers/     # request/response handling
│           ├── services/        # business logic
│           ├── models/          # Mongoose schemas
│           ├── middleware/      # auth, RBAC, rate limit, error handler
│           ├── lib/             # mailer, cloudinary, logger
│           └── index.ts
└── packages/
    └── shared/                  # Zod schemas + TypeScript types used by BOTH apps
```

Each app has its own `CLAUDE.md` with app-specific conventions. Read the nearest one.

---

## 4. Company facts

These values live in **`apps/web/config/company.ts`** and are imported everywhere —
footer, contact page, JSON-LD, email templates, legal pages. **Never hardcode them into a
component.**

| Field | Value |
|---|---|
| Legal name | NexaStack Technologies |
| Tagline | We Build Better Websites |
| Founded | 2026 |
| Founder | Md. Jakir Hossain, CEO |
| Address | House 14, Road 06, Uttara, Dhaka 1230, Bangladesh |
| Phone (display) | +880 1712-119253 |
| Phone (`tel:`) | `tel:+8801712119253` |
| WhatsApp link | `https://wa.me/8801712119253` |
| General email | nexastack@mail.com *(placeholder — see section 18)* |
| Hours | 10:00–18:00, six days a week |
| Weekly holiday | Friday |
| Time zone | Asia/Dhaka (UTC+6) |
| GitHub | https://github.com/Jakirhossain80 |
| LinkedIn | https://www.linkedin.com/in/jakir-hossain-dev |

**Phone format matters.** Bangladesh's country code is `+880`. The leading `0` in
`01712119253` is the domestic trunk prefix and is dropped internationally. The WhatsApp
click-to-chat URL requires digits only: `8801712119253`. `88001712119253` will not resolve.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router |
| UI | React + TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Monorepo | pnpm workspaces |
| Backend | Node.js + Express.js REST API |
| Database | MongoDB Atlas + Mongoose |
| Auth | Email/password, bcrypt, JWT in HTTP-only cookies |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| Server state | native `fetch` (public SSR), TanStack Query (admin only) |
| Media | Cloudinary, `next/image` |
| Email | Transactional provider (Resend / Postmark / Brevo — TBD) |
| Spam | Cloudflare Turnstile + express-rate-limit |
| Logging | Pino |
| Monitoring | Sentry, uptime service, health-check endpoints |
| API docs | OpenAPI / Swagger |
| Hosting | Vercel (web), Render (api), Atlas (db), Cloudinary (media) |

**Record exact pinned versions here after `pnpm install`.** Do not assume API shapes from
training data — when unsure about a Next.js, Tailwind or Mongoose API, fetch the current
docs.

### Explicitly not used

- **Redux, Zustand, Jotai, MobX** — URL search params and TanStack Query cover the state
  needs. Do not introduce a global store without explicit approval.
- **CSS-in-JS** (styled-components, Emotion) — Tailwind only.
- **Component libraries that ship their own visual design** (MUI, Ant Design, Chakra) —
  they fight the design system. Headless primitives (Radix, React Aria) are acceptable for
  accessible behaviour where hand-rolling is risky: dialogs, dropdowns, accordions.
- **Firebase Authentication** — deferred. The JWT scheme in section 11 is the auth system.
  Do not add a second one.

---

## 6. Commands

```bash
pnpm install                      # install all workspaces
pnpm dev                          # run web + api together
pnpm --filter web dev             # Next.js only
pnpm --filter api dev             # Express only
pnpm build                        # build all
pnpm lint                         # ESLint across workspaces
pnpm typecheck                    # tsc --noEmit across workspaces
pnpm test                         # test suites
pnpm format                       # Prettier write
```

**Before considering any task complete, run `pnpm lint` and `pnpm typecheck`.** A change
that does not typecheck is not finished.

---

## 7. Design tokens

Authoritative. Full specification in the project's design-system document; this section is
the build contract.

### 7.1 Colour

| Role | Light | Dark |
|---|---|---|
| Background | `#F8FAFC` | `#080D1A` |
| Background alt | `#F1F5F9` | `#0D1424` |
| Card surface | `#FFFFFF` | `#111A2E` |
| Text primary | `#0F172A` | `#F8FAFC` |
| Text secondary | `#475569` | `#A8B4C7` |
| Border | `#DCE4EE` | `#26334A` |
| Primary blue | `#1463FF` | `#4D8BFF` |
| Cyan accent | `#08B7ED` | `#25C7F5` |
| Violet accent | `#5530D9` | `#7957F2` |
| Success | `#15803D` | `#4ADE80` |
| Error | `#DC2626` | `#F87171` |

Define these once as CSS custom properties with light/dark variants and expose them to
Tailwind as semantic names (`bg-surface`, `text-secondary`, `border-default`). **Never
write a raw hex value in a component.**

**Contrast caution:** white on `#1463FF` is 4.93:1, which passes the 4.5:1 AA threshold for
normal text. Verify any new use of white-on-primary.

### 7.2 Brand gradient

Cyan → Royal Blue → Violet.

Permitted on: logo-related accents, hero artwork, primary highlights, selected headings,
decorative lines, featured-project accents.

**Forbidden on:** body text, every card, every button, large background areas.

### 7.3 Typography

- Primary: **Geist Sans** (fallback Inter, then Manrope)
- Mono: **Geist Mono** — technical labels and code only, never body copy

| Level | Desktop | Mobile |
|---|---|---|
| Hero heading | 56–72px | 38–48px |
| Page heading | 44–56px | — |
| Section heading | 32–44px | — |
| Card heading | 20–24px | — |
| Body | 16–18px | — |
| Small label | 13–14px | — |

Body line height 1.6–1.75. Body line length 60–75 characters.

### 7.4 Spacing and layout

| Token | Value |
|---|---|
| Max content width | 1200–1280px |
| Side padding — desktop | 32–48px |
| Side padding — tablet | 24–32px |
| Side padding — mobile | 16–20px |
| Section spacing — desktop | 80–120px |
| Section spacing — tablet | 56–80px |
| Section spacing — mobile | 40–64px |

12-column responsive grid on desktop.

### 7.5 Radii, borders, shadows

| Element | Radius |
|---|---|
| Card | 12–16px |
| Button | 10–12px |
| Large media | 16–20px |
| Form field | 8–10px |

Border width: **1px**. Shadows: soft, low-opacity, vertically restrained. In dark mode
rely on borders rather than shadows.

### 7.6 Motion

Duration **150–300ms**. Permitted: button hover, small card elevation, link-arrow
movement, accordion expansion, menu open/close, validation feedback, skeleton loading,
subtle section fade-and-rise, project image zoom 2–3%.

Every non-essential animation must be disabled under `prefers-reduced-motion: reduce`.
Implement this once as a global rule, not per component.

---

## 8. Design rules that are easy to violate

Read this list before writing any UI.

**Glassmorphism is permitted in exactly four places:**

1. A small hero statistic panel
2. A floating technology summary
3. Selected decorative elements
4. Optional desktop navigation background

Nowhere else. Never on cards holding important content. Never on form fields — it destroys
legibility.

**Cards** use Flat Design 2.0: solid surface, 1px border, subtle shadow, consistent radius,
slight elevation on hover. Not glass, not neumorphic, not heavily shadowed.

**Bento layouts** are for selected technology and capability sections only — not the
general page layout.

**Buttons:** three variants only (primary solid blue, secondary bordered, text with arrow).
Minimum height 44–48px. No fully-rounded pill shapes. No glow. Clear focus ring always.

**Forms:** solid neutral surfaces, labels above fields, 1px borders, blue focus rings.
Never translucent, never neumorphic.

**Light theme:** do not use pure white for every surface — sections lose separation. Use
the background/background-alt pair.

**Dark theme:** dim navy, never pure black. Reduced gradient brightness. Minimal glow. The
reversed logo variant is used automatically.

**Never build:** moving backgrounds, parallax, cursor-following effects, glitch effects,
kinetic typography, video backgrounds, large 3D or WebGL scenes, animation on every
element.

**Imagery:** genuine project screenshots, browser/device mockups, clean geometric
illustrations, subtle grid or node patterns. Never generic stock photos of people at
computers, cartoon characters, or cyberpunk visuals.

---

## 9. Component conventions

### 9.1 Server and Client Components

**Server Components are the default.** Add `'use client'` only when the component needs
state, effects, event handlers, or browser APIs — and push it as far down the tree as
possible. A page should not be a Client Component because one button inside it is
interactive.

### 9.2 Structure

- Primitives in `components/ui/` — no business logic, no data fetching
- Page sections in `components/sections/` — compose primitives, receive data as props
- One component per file, named export, PascalCase filename matching the component
- Props interfaces named `<Component>Props`, defined in the same file
- Use `cn()` (clsx + tailwind-merge) for conditional classes

### 9.3 Every interactive component must have

- A visible focus state using the token focus ring
- Correct light and dark rendering
- Keyboard operability
- Reduced-motion handling if it animates
- A touch target of at least 44px on mobile

---

## 10. Forms and validation

**The pattern, without exception:**

1. Zod schema defined in `packages/shared/schemas/`
2. `apps/web` imports it for React Hook Form via `@hookform/resolvers/zod`
3. `apps/api` imports the **same** schema to validate the request body

Client validation is convenience. Server validation is the security boundary. **Never trust
client-validated data.**

Forms use: labels above fields, explicit required indicators, inline validation, helpful
error messages (say what to do, not just what is wrong), visible success confirmation, and
logical field grouping.

The quotation form is multi-step. Keep step state local; persist to the server only on
final submit.

---

## 11. API conventions

### 11.1 Layering

`routes/` define paths and attach middleware → `controllers/` parse requests and shape
responses → `services/` hold business logic → `models/` hold Mongoose schemas.

**Controllers must not contain business logic. Services must not touch `req` or `res`.**

### 11.2 Response envelope

Consistent across every endpoint:

```
Success:  { "success": true,  "data": <payload> }
Error:    { "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
```

Status codes: `200` ok, `201` created, `400` validation, `401` unauthenticated,
`403` unauthorised, `404` not found, `409` conflict, `429` rate-limited, `500` server.

**Never leak internal error messages, stack traces or Mongo errors to the client.** Log
the detail with Pino; return a safe message.

### 11.3 Auth and RBAC

- Email/password, bcrypt-hashed (cost factor 12 or above)
- JWT stored in an HTTP-only, `Secure`, `SameSite` cookie — **never in `localStorage`**
- Roles: `super_admin`, `admin`, `content_editor`
- Role checks enforced by middleware on the route, **never in the UI alone**. Hiding a
  button is not authorisation.
- Sessions expire; logout invalidates
- Significant admin actions written to an audit log

**Cookie/domain note:** the web app and API must share a registrable domain
(`nexastack.example` and `api.nexastack.example`) so the session cookie can use
`SameSite=Lax`. If they end up on different sites, the cookie requires
`SameSite=None; Secure` with CORS `credentials: true` and an explicit origin allowlist —
and Safari's tracking prevention will still cause problems. Raise this rather than working
around it.

### 11.4 Mandatory on every endpoint

- Server-side Zod validation of body, params and query
- Helmet security headers
- CORS restricted to an explicit origin allowlist — never `*` with credentials
- `express-rate-limit` on auth, contact and quotation routes
- Sanitised input, guarding against NoSQL injection (never pass raw user objects into a
  query)
- A defined CSRF strategy for cookie-authenticated mutations
- Structured Pino logging with a request id
- An OpenAPI annotation

### 11.5 Database

- Indexes on slugs, search fields, content status, and submission timestamps
- Mongoose schema-level validation in addition to Zod
- `lean()` for read-only queries
- Never return password hashes or tokens from a query — use `select: false`

---

## 12. Data fetching

| Context | Approach |
|---|---|
| Public pages | Server Components with native `fetch`, appropriate caching |
| Admin interface | TanStack Query for caching, mutations, optimistic updates |
| Filters, pagination, search | **URL search params** — shareable, bookmarkable, back-button correct |

Do not lift filter state into React state when the URL can hold it.

---

## 13. SEO

Every public page requires:

- `metadata` export (Next.js Metadata API) — title, description, canonical
- Dynamic metadata for services, projects and blog posts
- Open Graph and Twitter card metadata with a generated share image
- JSON-LD structured data using the appropriate type: `Organization` (site-wide),
  `Service`, `Article`, `BreadcrumbList`
- Semantic heading order — exactly one `<h1>` per page, no level skipping

`sitemap.ts` and `robots.ts` live at the `app/` root and are generated, not hand-written.

---

## 14. Accessibility — non-negotiable

Target: **WCAG 2.1 AA**.

- Semantic HTML first. ARIA only where semantics are insufficient.
- Contrast ≥4.5:1 normal text, ≥3:1 large text and UI boundaries
- Every interactive element reachable and operable by keyboard, in logical order
- Visible focus indicators — never `outline: none` without a replacement
- Every form control has an associated label; errors linked via `aria-describedby`
- Never convey meaning by colour alone — pair with text or an icon
- All images have meaningful `alt`; decorative images use `alt=""`
- Accordions, dropdowns and dialogs follow the WAI-ARIA authoring patterns
- `prefers-reduced-motion` respected
- No horizontal scrolling at any breakpoint
- Touch targets ≥44px

Run axe-core checks on new pages before considering them done.

---

## 15. Media

- `next/image` for all images, with explicit `width`/`height` or `fill` plus `sizes`
- Uploads go to Cloudinary; metadata and alt text stored in MongoDB
- File type and size validated **server-side** — never trust the client
- Generate responsive variants and social-sharing images
- Alt text is a required field on upload, not optional

---

## 16. Responsive behaviour

Mobile-first. Three tiers:

**Desktop** — multi-column, full navigation, large hero type, split featured-project
layout, controlled bento sections.

**Tablet** — two-column cards, reduced type scale, simplified spacing.

**Mobile** — single column, compact header, full-height menu drawer, full-width primary
CTAs, stacked project details, simplified decorative elements, no horizontal scroll.

Test every new section at 375px, 768px, 1280px and 1920px.

---

## 17. Security checklist

- Secrets in environment variables only. **Never commit `.env*`. Never print a secret.**
- Validate every input server-side
- Escape and sanitise any user-generated content before rendering
- Rate-limit auth and public form endpoints
- Role middleware on every protected route
- Audit-log significant admin actions
- Database and media backups configured
- Dependencies kept current; no unmaintained packages

---

## 18. Environment variables

Every variable must appear in `.env.example` with a description and a dummy value.
`.env.example` is committed; `.env*` is not.

Expected set: MongoDB URI, JWT secret, cookie domain, Cloudinary credentials, email
provider API key, Turnstile keys, Sentry DSN, public site URL, public API URL.

`NEXT_PUBLIC_*` variables are visible in the browser. Never prefix a secret.

---

## 19. Git and workflow

- `main` is deployable at all times
- Branches: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
- Conventional commit subjects: `feat(web): add services grid section`
- Small, focused PRs with a description of what changed and why
- `pnpm lint` and `pnpm typecheck` must pass before commit
- **Do not commit or push unless asked.**

---

## 20. Testing

Minimum coverage expected:

- Unit tests for Zod schemas and service-layer logic
- Integration tests for auth, contact and quotation endpoints
- An E2E smoke test of the contact and quotation flows — these are the paths where a
  silent failure costs a real client
- axe-core accessibility assertions on key pages

---

## 21. Do not

- Add dependencies without asking
- Introduce a global state library
- Use `localStorage` for auth tokens
- Write raw hex colours or arbitrary spacing values in components
- Apply glassmorphism outside the four permitted uses
- Use gradients on body text, every card, or every button
- Skip server-side validation because the client validates
- Return internal errors to the client
- Redesign UI you were not asked to touch
- Delete or rewrite existing working code as a side effect of another task
- Commit `.env` files or print secrets
- Mark work complete without running lint and typecheck

---

## 22. Open decisions

Do not silently resolve these. Ask.

1. **Domain name** — not registered. Affects cookie strategy (section 11.3), email
   addresses, canonical URLs, and Open Graph URLs.
2. **Build phasing** — recommended: phase 1 marketing site with a working contact form;
   phase 2 admin dashboard and blog; phase 3 quotation system. Confirm before scaffolding
   the admin area.
3. **Blog content source** — MDX files, a headless CMS, or admin dashboard with a rich-text
   editor. Unresolved and non-trivial.
4. **Transactional email provider** — Resend, Postmark or Brevo.
5. **Render hosting tier** — the free tier sleeps and adds ~30s to the first request.
   Unacceptable for a contact form. Either pay, or serve contact/quotation from Next.js
   Route Handlers and reserve Express for the admin API.
6. **General email address** — `nexastack@mail.com` is a free generic mailbox and weakens
   credibility. Move to `hello@<domain>` once registered. Do not publish an unmonitored
   address.
7. **Business type** — not specified. Needed for legal pages and `Organization` JSON-LD.
8. **Address publication** — the supplied address is residential in format. Decide whether
   to publish it fully or show only "Uttara, Dhaka, Bangladesh".
9. **Target market** — local, international, or both. Affects copy, currency, time-zone
   handling and stated response times.
10. **Service list** — not yet defined. Required before the Services and Solutions pages.
11. **Logo variants** — only a square raster PNG with a white background exists. A
    horizontal lockup, a mark-only version, a reversed dark-mode version and an SVG are all
    needed.
NEXASTACK_EOF_0
echo "  created CLAUDE.md"

cat > 'apps/web/CLAUDE.md' <<'NEXASTACK_EOF_1'
# CLAUDE.md — apps/web

Next.js App Router application: public marketing site and admin interface.
Root `CLAUDE.md` applies first. This file adds web-specific rules.

---

## 1. Routing

```
app/
├── (marketing)/          # public pages — no auth
│   ├── page.tsx                  # homepage
│   ├── about/
│   ├── services/[slug]/
│   ├── solutions/[slug]/
│   ├── portfolio/[slug]/
│   ├── technologies/
│   ├── process/
│   ├── blog/[slug]/
│   ├── faq/
│   ├── contact/
│   ├── quotation/
│   └── legal/[slug]/
├── (admin)/              # auth-guarded
│   └── admin/
│       ├── layout.tsx            # auth check + admin shell
│       ├── page.tsx              # dashboard
│       ├── enquiries/
│       ├── quotations/
│       ├── projects/
│       ├── blog/
│       ├── media/
│       └── users/
├── api/                  # Route Handlers — see section 6
├── layout.tsx
├── sitemap.ts
├── robots.ts
└── not-found.tsx
```

Route groups `(marketing)` and `(admin)` do not appear in URLs. They exist so the two
areas can have separate layouts.

---

## 2. Server and Client Components

**Server Component is the default.** Add `'use client'` only for state, effects, event
handlers or browser APIs.

Push the boundary as deep as possible. A page is not a Client Component because one button
in it is interactive — extract the button.

Never pass a function, class instance or Date-containing object across the
server→client boundary unless it serialises cleanly.

---

## 3. Component organisation

| Folder | Contains | Rules |
|---|---|---|
| `components/ui/` | Button, Card, Input, Badge, Accordion | No data fetching, no business logic |
| `components/sections/` | Hero, ServicesGrid, ProcessTimeline, CTABand | Receive data as props |
| `components/layout/` | Navbar, Footer, ThemeToggle, MobileDrawer | Site chrome |
| `components/admin/` | Tables, forms, dashboard widgets | Admin only |

One component per file. Named export. PascalCase filename matching the component.
Props interface named `<Component>Props` in the same file.

Use `cn()` (clsx + tailwind-merge) for conditional classes. Never build class strings by
concatenation.

---

## 4. Styling

Tailwind only. **Semantic token classes, never raw values.**

```
✅  bg-surface  text-secondary  border-default  rounded-card  text-primary-blue
❌  bg-[#FFFFFF]  text-[#475569]  rounded-[14px]  text-[#1463FF]
```

Tokens are defined once in the Tailwind theme with light/dark variants. If a token you
need does not exist, ask before adding one.

Dark mode is class-based with three states: light, dark, system. Persist the choice and
apply it before first paint to avoid a flash.

---

## 5. Data fetching

| Context | Approach |
|---|---|
| Public pages | Server Component + native `fetch` with explicit caching |
| Admin | TanStack Query |
| Filters, pagination, search | URL search params via `useSearchParams` / `searchParams` |

Never use TanStack Query in a public Server Component. Never lift filter state into React
state when the URL can hold it.

---

## 6. Route Handlers vs the Express API

Default: business logic lives in the Express API.

Route Handlers in `app/api/` are appropriate for:

- Proxying to the Express API where a server-side secret is required
- Endpoints that must never cold-start (contact/quotation, if that decision is taken —
  see root `CLAUDE.md` section 22.5)
- OG image generation
- Webhook receivers

Do not duplicate an endpoint in both places.

---

## 7. Forms

React Hook Form + Zod schema imported from `packages/shared`.

```
schema (packages/shared) → useForm({ resolver: zodResolver(schema) }) → submit → API
```

Requirements: labels above fields, explicit required markers, inline validation, errors
linked with `aria-describedby`, disabled submit while pending, visible success state.

The quotation form is multi-step: keep step state local, validate per step, submit once at
the end.

---

## 8. Images

`next/image` everywhere. Explicit `width`/`height`, or `fill` with `sizes`.

- `priority` on the hero image only
- Meaningful `alt`; `alt=""` for decorative
- Cloudinary domain registered in `next.config`
- No layout shift — reserve space for every image

---

## 9. Metadata and SEO

Every public route exports `metadata` or `generateMetadata`:

- Unique title and description
- Canonical URL
- Open Graph + Twitter card with a share image
- JSON-LD via a `<script type="application/ld+json">` in the page

Types: `Organization` site-wide, `Service`, `Article` for blog posts, `BreadcrumbList` on
nested pages.

One `<h1>` per page. No heading level skipped.

---

## 10. Company data

Import from `config/company.ts`. Never hardcode the phone number, address, email or hours
into a component — they appear in the footer, contact page, JSON-LD and email templates,
and must change in one place.

WhatsApp link format: `https://wa.me/8801712119253` — digits only, no `+`, no leading zero.

---

## 11. Accessibility in components

Before a component is done:

- Keyboard reachable and operable in logical order
- Visible focus ring using the token
- Correct in light and dark
- Labelled if it is a form control
- Animations disabled under `prefers-reduced-motion`
- Touch target ≥44px on mobile
- Contrast verified — note white on `#1463FF` is 4.93:1 (passes AA for normal text); verify
  this pairing wherever it is used

Use Radix or React Aria for dialogs, dropdowns, accordions and tabs rather than hand-
rolling focus traps and ARIA wiring.

---

## 12. Performance

- No client-side data fetching for content visible above the fold on a public page
- Dynamic-import heavy admin-only components
- `next/font` for Geist — never a `<link>` to a font CDN
- Watch bundle size when adding a client dependency

---

## 13. Do not

- Use `'use client'` at page level to avoid thinking about the boundary
- Write raw hex colours or arbitrary pixel values
- Fetch in a `useEffect` where a Server Component would do
- Duplicate a Zod schema instead of importing from `packages/shared`
- Add a component library that ships its own visual design
- Store auth tokens in `localStorage`
NEXASTACK_EOF_1
echo "  created apps/web/CLAUDE.md"

cat > 'apps/api/CLAUDE.md' <<'NEXASTACK_EOF_2'
# CLAUDE.md — apps/api

Express REST API for NexaStack Technologies.
Root `CLAUDE.md` applies first. This file adds API-specific rules.

---

## 1. Structure

```
src/
├── index.ts              # app bootstrap, middleware order, graceful shutdown
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

## 2. Middleware order in `index.ts`

```
helmet
cors (explicit origin allowlist, credentials: true)
cookie-parser
express.json (with size limit)
pino-http (request id)
rate limiters (per-route)
routes
404 handler
error handler (last, 4-arg signature)
```

Order matters. The error handler is always last.

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
NEXASTACK_EOF_2
echo "  created apps/api/CLAUDE.md"

cat > 'packages/shared/CLAUDE.md' <<'NEXASTACK_EOF_3'
# CLAUDE.md — packages/shared

Zod schemas and TypeScript types shared by `apps/web` and `apps/api`.
Root `CLAUDE.md` applies first.

---

## 1. Purpose

This package exists so a validation rule is written **once** and enforced in both places:
the browser form and the API endpoint.

```
packages/shared/schemas/contact.ts
        ├── apps/web  → zodResolver(contactSchema) in React Hook Form
        └── apps/api  → validate(contactSchema) middleware
```

If the two ever disagree, a user passes client validation and fails server validation with
a confusing error. That is the bug this package prevents.

---

## 2. Structure

```
src/
├── schemas/          # Zod schemas, one file per domain
│   ├── contact.ts
│   ├── quotation.ts
│   ├── auth.ts
│   ├── project.ts
│   ├── blog.ts
│   ├── service.ts
│   └── media.ts
├── types/            # types inferred from schemas + shared enums
├── constants/        # role names, status enums, category lists
└── index.ts          # explicit public exports
```

---

## 3. Rules

**This package must stay environment-agnostic.** No `next/*`, no `express`, no `mongoose`,
no `window`, no `process.env`. It runs in the browser and on the server.

**Derive types from schemas, never write them twice:**

```ts
export const contactSchema = z.object({ /* ... */ });
export type ContactInput = z.infer<typeof contactSchema>;
```

**Split schemas where client and server needs differ**, rather than loosening one shared
schema:

```ts
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const createUserSchema = loginSchema.extend({ role: roleEnum, name: z.string().min(2) });
```

**Error messages are user-facing.** Write them as the user should read them — say what to
do, not just what is wrong.

```ts
z.string().email("Please enter a valid email address")   // ✅
z.string().email("Invalid")                              // ❌
```

**Keep shared constants here**, not duplicated in either app: role names, content status
values, project categories, service slugs.

---

## 4. Versioning within the monorepo

Changing a schema changes both apps. Before modifying an existing schema, check every
usage in `apps/web` and `apps/api` — a tightened rule can break a working admin form.

Adding an optional field is safe. Adding a required field, tightening a constraint, or
renaming a field is a breaking change: update both apps in the same commit.

---

## 5. Do not

- Import anything framework- or runtime-specific
- Write a TypeScript interface that duplicates a Zod schema
- Define a schema here that only one app uses — keep it local to that app instead
- Put business logic here; this package holds shapes and constants only
NEXASTACK_EOF_3
echo "  created packages/shared/CLAUDE.md"

cat > '.claude/settings.json' <<'NEXASTACK_EOF_4'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm add:*)",
      "Bash(pnpm dev:*)",
      "Bash(pnpm build:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm format:*)",
      "Bash(pnpm --filter:*)",
      "Bash(pnpm dlx:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(tsc:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git checkout:*)",
      "Bash(git switch:*)",
      "Bash(git stash:*)",
      "Bash(gh pr view:*)",
      "Bash(gh pr list:*)",
      "Bash(gh issue list:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(find:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(wc:*)",
      "Bash(which:*)",
      "Bash(echo:*)",
      "Bash(pwd)",
      "Read(**)",
      "Edit(**)",
      "Write(**)",
      "WebFetch(domain:nextjs.org)",
      "WebFetch(domain:tailwindcss.com)",
      "WebFetch(domain:mongoosejs.com)",
      "WebFetch(domain:zod.dev)",
      "WebFetch(domain:tanstack.com)",
      "WebFetch(domain:react-hook-form.com)",
      "WebFetch(domain:expressjs.com)",
      "WebFetch(domain:developer.mozilla.org)",
      "WebFetch(domain:www.w3.org)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean -fd:*)",
      "Bash(pnpm publish:*)",
      "Bash(npm publish:*)",
      "Bash(cat .env:*)",
      "Bash(cat **/.env:*)",
      "Bash(printenv)",
      "Bash(env)",
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/id_rsa*)",
      "Edit(.env)",
      "Edit(**/.env)",
      "Edit(**/.env.*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(jq -r '.tool_input.file_path // empty'); case \"$FILE\" in *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md) [ -f \"$FILE\" ] && npx --no-install prettier --write \"$FILE\" >/dev/null 2>&1 ;; esac; exit 0"
          }
        ]
      }
    ]
  }
}
NEXASTACK_EOF_4
echo "  created .claude/settings.json"

cat > '.claude/commands/new-section.md' <<'NEXASTACK_EOF_5'
---
description: Scaffold a new marketing page section following the NexaStack design system
---

Create a new page section component: **$ARGUMENTS**

Follow the design system in the root `CLAUDE.md` section 7 and `apps/web/CLAUDE.md`.

## Requirements

**Location:** `apps/web/components/sections/<Name>.tsx`

**Structure**
- Server Component by default. Only add `'use client'` if it genuinely needs interactivity,
  and if so extract the interactive part into a smaller child component instead.
- Accept content as props with a `<Name>Props` interface. Do not hardcode copy inside the
  component unless it is purely structural.
- Wrap in a `<section>` element with an `aria-labelledby` pointing at its heading.

**Layout**
- Max content width 1200–1280px, centred
- Side padding: 16–20px mobile, 24–32px tablet, 32–48px desktop
- Section vertical spacing: 40–64px mobile, 56–80px tablet, 80–120px desktop
- Use the semantic Tailwind token classes only — no raw hex, no arbitrary pixel values

**Visual rules**
- Cards: solid surface, 1px border, 12–16px radius, subtle shadow, slight hover elevation
- No glassmorphism unless this is specifically a hero statistic panel or floating
  technology summary
- Gradients only as accents — never on body text, never on every card
- Buttons: existing `Button` primitive, never a new one

**Responsive**
- Mobile single column, tablet two columns, desktop as appropriate to the content
- No horizontal overflow at any width
- Touch targets ≥44px

**Accessibility**
- Correct heading level for its position in the page — do not skip levels
- Visible focus rings on anything interactive
- Meaningful `alt` text, or `alt=""` if decorative
- Any animation limited to 150–300ms and disabled under `prefers-reduced-motion`

**Both themes**
- Verify light and dark rendering; dark uses dim navy surfaces and relies on borders
  rather than heavy shadows

## Before finishing

1. Run `pnpm lint` and `pnpm typecheck`
2. List any assumptions you made about the content shape
3. Do not modify unrelated components or pages
NEXASTACK_EOF_5
echo "  created .claude/commands/new-section.md"

cat > '.claude/commands/new-endpoint.md' <<'NEXASTACK_EOF_6'
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
NEXASTACK_EOF_6
echo "  created .claude/commands/new-endpoint.md"

cat > '.claude/commands/design-check.md' <<'NEXASTACK_EOF_7'
---
description: Audit a component or page against the NexaStack design system
---

Audit **$ARGUMENTS** against the design system in the root `CLAUDE.md` sections 7 and 8.

Report findings as a list. For each: the file, the line, what is wrong, and the fix.
**Do not change anything yet** — report first, then wait for approval.

## Check

**Tokens**
- [ ] No raw hex colours — semantic token classes only
- [ ] No arbitrary Tailwind values (`w-[473px]`, `text-[15px]`, `rounded-[14px]`)
- [ ] Colours used in their intended role (primary text is not the secondary token)

**Radii and borders**
- [ ] Cards 12–16px, buttons 10–12px, large media 16–20px, form fields 8–10px
- [ ] Border width 1px
- [ ] Not fully rounded unless intentionally an avatar or pill badge

**Glassmorphism**
- [ ] Present only in: hero statistic panel, floating technology summary, selected
      decorative elements, or desktop nav background
- [ ] Never on content cards or form fields

**Gradients**
- [ ] Used only as accents — logo-related, hero artwork, highlights, selected headings,
      decorative lines, featured-project accents
- [ ] Not on body text, not on every card, not on every button

**Typography**
- [ ] Sizes match the scale in `CLAUDE.md` 7.3
- [ ] Geist Mono only on technical labels, never on paragraphs
- [ ] Body line height 1.6–1.75, line length 60–75 characters

**Spacing**
- [ ] Section spacing and side padding match the responsive scale
- [ ] Content width capped at 1200–1280px

**Buttons**
- [ ] One of the three approved variants
- [ ] Height 44–48px minimum
- [ ] No glow effect
- [ ] Visible focus ring

**Motion**
- [ ] Durations 150–300ms
- [ ] No parallax, cursor-following, moving background, glitch or kinetic type
- [ ] `prefers-reduced-motion` respected

**Themes**
- [ ] Renders correctly in light and dark
- [ ] Light theme does not use pure white for every surface
- [ ] Dark theme is dim navy, not pure black, and leans on borders over shadows

**Shadows**
- [ ] Soft, low-opacity, vertically restrained
- [ ] No hard or deep floating shadows

## Output

Group findings as **Must fix** (violates a stated rule) and **Consider** (within the rules
but inconsistent with the rest of the codebase). If nothing is wrong, say so plainly rather
than inventing issues.
NEXASTACK_EOF_7
echo "  created .claude/commands/design-check.md"

cat > '.claude/commands/a11y-check.md' <<'NEXASTACK_EOF_8'
---
description: Audit a component or page against WCAG 2.1 AA
---

Audit **$ARGUMENTS** for accessibility. Target is **WCAG 2.1 AA**, which the root
`CLAUDE.md` section 14 treats as non-negotiable.

Report findings first with file, line, the criterion breached, and the fix.
**Do not change anything until approved.**

## Check

**Semantics**
- [ ] Semantic elements used (`nav`, `main`, `section`, `article`, `button`, `a`)
- [ ] No `<div>` with an onClick standing in for a button
- [ ] ARIA used only where semantic HTML is insufficient — and used correctly
- [ ] Landmarks present and not duplicated

**Headings**
- [ ] Exactly one `<h1>` per page
- [ ] No skipped levels
- [ ] Headings describe content, not styled for size alone

**Keyboard**
- [ ] Every interactive element reachable by Tab
- [ ] Tab order follows visual order
- [ ] Escape closes dialogs and menus
- [ ] Focus trapped inside modals, restored on close
- [ ] No keyboard trap anywhere

**Focus**
- [ ] Visible focus indicator on every focusable element
- [ ] No `outline: none` without an equivalent replacement
- [ ] Focus ring has ≥3:1 contrast against its background

**Contrast**
- [ ] Normal text ≥4.5:1
- [ ] Large text (≥18.66px bold / ≥24px) ≥3:1
- [ ] UI component boundaries and icons ≥3:1
- [ ] Verified in **both** light and dark themes
- [ ] Special attention to white on `#1463FF` (4.93:1 — passes AA for normal text; verify every use)

**Forms**
- [ ] Every control has an associated `<label>`
- [ ] Required fields marked in text, not by colour or asterisk alone
- [ ] Errors linked via `aria-describedby`
- [ ] Error messages explain how to fix, not just that something is wrong
- [ ] `aria-invalid` set on failing fields
- [ ] Success confirmation announced to screen readers

**Images and media**
- [ ] Meaningful `alt` on informative images
- [ ] `alt=""` on decorative images
- [ ] Alt text describes purpose, not appearance
- [ ] No text baked into images

**Colour and meaning**
- [ ] Nothing conveyed by colour alone — paired with text or an icon
- [ ] Status indicators readable without colour perception

**Motion**
- [ ] `prefers-reduced-motion: reduce` removes non-essential animation
- [ ] Nothing auto-plays or loops indefinitely

**Responsive**
- [ ] No horizontal scroll at 320px
- [ ] Touch targets ≥44px
- [ ] Content readable at 200% zoom
- [ ] Works in portrait and landscape

## Then

If a dev server is running and a browser tool is available, load the page and run axe-core
against it, and report what it finds alongside the manual review.

Separate findings into **Violations** (fails AA) and **Improvements** (passes AA but could
be better). Be accurate — do not report a violation you have not verified.
NEXASTACK_EOF_8
echo "  created .claude/commands/a11y-check.md"

cat > '.env.example' <<'NEXASTACK_EOF_9'
# NexaStack Technologies — environment variables
# Copy to .env and fill in real values. NEVER commit .env.
# Variables prefixed NEXT_PUBLIC_ are visible in the browser — never put a secret there.

# ─── Web (apps/web) ────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x0000000000000000000000

# ─── API (apps/api) ────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=4000

# Comma-separated list of allowed origins. Never use "*" with credentials.
CORS_ORIGINS=http://localhost:3000

# ─── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/nexastack?retryWrites=true&w=majority

# ─── Auth ──────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 48
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1d

# Leave empty in development. In production set to the shared parent domain
# (e.g. .nexastack.example) so the cookie works across web and api subdomains.
COOKIE_DOMAIN=
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

BCRYPT_ROUNDS=12

# ─── Media (Cloudinary) ────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=nexastack

# ─── Transactional email ───────────────────────────────────────────────────────
# Provider still to be decided: Resend / Postmark / Brevo
EMAIL_PROVIDER=resend
EMAIL_API_KEY=
EMAIL_FROM="NexaStack Technologies <hello@example.com>"
EMAIL_TO_ENQUIRIES=hello@example.com

# ─── Spam protection ───────────────────────────────────────────────────────────
TURNSTILE_SECRET_KEY=

# ─── Monitoring ────────────────────────────────────────────────────────────────
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
LOG_LEVEL=info
NEXASTACK_EOF_9
echo "  created .env.example"

# AGENTS.md is a symlink to CLAUDE.md so both stay in sync
ln -sf CLAUDE.md AGENTS.md
echo "  created AGENTS.md (symlink -> CLAUDE.md)"

# Keep local Claude overrides out of git
if [ -f .gitignore ]; then
  grep -qxF '.claude/settings.local.json' .gitignore || echo '.claude/settings.local.json' >> .gitignore
  grep -qxF '.env' .gitignore || printf '.env\n.env.*\n!.env.example\n' >> .gitignore
fi

echo ""
echo "Done. Next steps:"
echo "  1. Review CLAUDE.md section 22 - open decisions to resolve"
echo "  2. cp .env.example .env  and fill in real values"
echo "  3. Record exact package versions in CLAUDE.md section 5 after pnpm install"
