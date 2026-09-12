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
