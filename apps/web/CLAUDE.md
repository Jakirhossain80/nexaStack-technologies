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
