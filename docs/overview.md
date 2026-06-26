# Project Overview

A deep reference for the AI Form Builder: what it does, how it's structured, the
database, the API, and how data flows through the system. For setup and scripts
see the [README](../README.md); for language patterns see
[typescript-features.md](./typescript-features.md).

## What it is

A web app that turns a plain-language description into a working form:

1. A user describes a form on `/builder` ("a contact form with name, email, and a message").
2. Claude generates the field definitions.
3. The user previews/tests the form and saves it.
4. The saved form gets a public URL where anyone can fill it in.
5. Responses are collected and shown in a results table.

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components, file-based routing, Route Handlers |
| Language | TypeScript (strict) | See [typescript-features.md](./typescript-features.md) |
| Database | Prisma 7 + SQLite | File-based, via the `better-sqlite3` driver adapter |
| AI | Anthropic Claude (`claude-haiku-4-5`) | Fast/cheap structured generation |
| UI | Tailwind CSS + shadcn/ui (Base UI) | Utility CSS + accessible primitives |
| Validation | Zod | Schema-first; static types via `z.infer` |

## Architecture

The code is split into strict layers; imports flow **downward only**, so a lower
layer never depends on a higher one.

```
types/                  pure TypeScript types — no logic, no imports from the app
   ↓
lib/                    business logic — no React, no HTTP, no Next.js
   ↓
components/ + hooks/    React — import from lib/ and types/
   ↓
app/                    pages + thin API routes that delegate to lib/
```

Why it matters: business logic in `lib/` stays free of HTTP and React, so it's
independently testable and reusable, and there are no circular dependencies.
API routes are deliberately thin — parse → validate → call `lib/` → shape a response.

Two cross-cutting rules:

- **Every external input is `unknown` first**, then validated with Zod or a type
  guard before use (request bodies, AI output, DB JSON, fetch responses).
- **Every API route returns `ApiResponse<T>`**: `{ ok: true, data } | { ok: false, error, code }`.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts          POST → AI generates fields
│   │   ├── forms/route.ts             GET list · POST create
│   │   ├── forms/[id]/route.ts        GET one · DELETE (stubs)
│   │   └── submissions/route.ts       POST → save a response
│   ├── builder/page.tsx               generate + preview + save
│   ├── forms/page.tsx                 browse saved forms
│   ├── forms/[id]/page.tsx            public fillable form
│   ├── forms/[id]/results/page.tsx    responses table
│   ├── layout.tsx                     root layout + SiteHeader
│   └── page.tsx                       home
├── components/
│   ├── fields/   TextField, NumberField, SelectField, CheckboxField, DateField,
│   │             FieldInput (the exhaustive renderer), index.ts
│   ├── builder/  FormBuilder (interactive preview)
│   ├── form/     FormFiller, CopyLinkButton
│   ├── layout/   SiteHeader (home + back + nav)
│   └── ui/       button (shadcn/Base UI)
├── hooks/        useFormBuilder, useSaveForm, useFormSubmission
├── lib/
│   ├── ai/generate-form.ts            Claude call, safe parsing, FormGenerationError
│   ├── db/
│   │   ├── prisma.ts                  singleton PrismaClient (better-sqlite3 adapter)
│   │   ├── forms.repository.ts        getAllForms, getFormById, createForm
│   │   └── submissions.repository.ts  createSubmission, getSubmissions
│   ├── validators/
│   │   ├── field.validators.ts        Zod field schemas + isFormFieldArray guard
│   │   ├── form.validators.ts         createFormSchema + CreateFormInput
│   │   └── format-zod-error.ts        ZodError → readable string
│   └── utils.ts                       cn(), isRecord()
└── types/        field.types, form.types, api.types, index (barrel)
```

## Database

SQLite via Prisma 7. Schema (`prisma/schema.prisma`):

```prisma
model Form {
  id          String       @id @default(cuid())
  title       String
  description String?
  fields      String       @default("[]")   // FormField[] serialized as JSON
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  submissions Submission[]
}

model Submission {
  id        String   @id @default(cuid())
  formId    String
  data      String                          // Record<string, unknown> as JSON
  createdAt DateTime @default(now())
  form      Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
}
```

Design decisions:

- **Fields stored as JSON, not relational rows.** A form's fields are a dynamic,
  schema-less list, so they're serialized into the `fields` text column. The
  repositories serialize on write (`JSON.stringify`) and parse + validate on read
  (`isFormFieldArray` / `isRecord`), tolerating bad data by falling back to `[]`/`{}`.
- **Submission `data` is JSON too**, a `field.id → value` map, validated for shape
  (`{ formId, data }`) on write. Per-field answer validation is currently
  client-side in `FormFiller`.
- **Cascade delete.** Deleting a `Form` removes its `Submission`s
  (`onDelete: Cascade`).
- **Prisma 7 driver adapter.** Prisma 7 has no built-in drivers; we pass
  `@prisma/adapter-better-sqlite3` to `new PrismaClient({ adapter })`
  (`src/lib/db/prisma.ts`).
- **Client singleton.** The `PrismaClient` is cached on `globalThis` so dev-mode hot
  reloads don't open a new connection on every change.
- The generated client is emitted to `src/generated/prisma` (git-ignored).
  Run `npx prisma migrate dev` after schema changes; `npx prisma studio` for a GUI.

## API

All routes are Next.js Route Handlers under `src/app/api/` and return `ApiResponse<T>`.

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `POST /api/generate` | `{ prompt }` | `200` `FormField[]` | `400` invalid input · `429/502/503` AI failures · `500` |
| `GET /api/forms` | — | `200` `FormPreview[]` | `500` |
| `POST /api/forms` | `{ title, description?, fields }` | `201` `FormPreview` | `400` invalid input · `500` |
| `GET /api/forms/[id]` | — | *(stub)* | `501` |
| `DELETE /api/forms/[id]` | — | *(stub)* | `501` |
| `POST /api/submissions` | `{ formId, data }` | `201` `null` | `400` invalid input · `404` form not found · `500` |

Validation failures return the specific Zod message (e.g. `prompt: Too small …`)
via `formatZodError`. AI failures are categorized into safe, user-facing messages
by `FormGenerationError` (rate-limited, unauthenticated, unreachable, invalid JSON,
malformed fields) with appropriate status codes.

## Data flows

**Generate** — `/builder` → `useFormBuilder`:

```
prompt → POST /api/generate → generateForm()
  → Claude messages.create (system prompt forces raw JSON)
  → strip code fence → JSON.parse → isFormFieldArray guard → FormField[]
  → { ok: true, data } → preview
```

**Save** — `useSaveForm`:

```
{ title, fields } → POST /api/forms → createFormSchema.parse
  → createForm() (JSON.stringify fields) → 201 → redirect to /forms
```

**Browse** — `/forms` is a Server Component that calls `getAllForms()` directly
(no API round-trip) and streams the list behind a `<Suspense>` skeleton.

**Fill & submit** — `/forms/[id]` (Server Component, `notFound()` on bad id) renders
`FormFiller`:

```
answers → useFormSubmission → POST /api/submissions
  → form existence check (404 if missing) → createSubmission() → 201 → thank-you
```

**Results** — `/forms/[id]/results` fetches the form + `getSubmissions()` in parallel
and renders a table: a timestamp column plus one column per field.

## Pages

| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Landing page |
| `/builder` | Client | Generate, preview/test, and save a form |
| `/forms` | Server (streamed) | Browse saved forms; links to each form + its responses |
| `/forms/[id]` | Server | Public fillable form with a copy-link share button |
| `/forms/[id]/results` | Server | Table of all responses |

A sticky `SiteHeader` (in the root layout) provides Home, a contextual Back button,
and links to the forms list and builder on every page.
