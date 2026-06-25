# Project Overview

## What We Are Building

**AI Form Builder** — a web app where:
1. A user describes a form in plain language ("I need a job application form")
2. Claude AI generates the form fields
3. The user can share the form, collect responses, and view results

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16, App Router | Server components, file-based routing, API routes in one project |
| Language | TypeScript (strict mode) | Catches bugs at compile time, makes the AI response parsing safe |
| Database | Prisma 7 + SQLite | Simple file-based DB, zero config for local dev |
| AI | Anthropic Claude API (`claude-haiku-4-5`) | Fast and cheap for structured generation |
| UI | Tailwind CSS + shadcn/ui | Utility-first CSS with ready-made accessible components |
| Validation | Zod | Schema-first validation that generates TypeScript types |

---

## Folder Structure

```
ai-form-builder/
├── prisma/
│   ├── schema.prisma          ← database models
│   └── migrations/            ← auto-generated SQL migration history
├── prisma.config.ts           ← Prisma 7 config (DB URL, migration path)
├── src/
│   ├── app/                   ← Next.js App Router pages + API routes
│   │   ├── api/
│   │   │   ├── forms/route.ts         GET all / POST create
│   │   │   ├── forms/[id]/route.ts    GET one / DELETE
│   │   │   ├── generate/route.ts      POST → AI generates fields
│   │   │   └── submissions/route.ts   POST → save a form response
│   │   ├── forms/
│   │   │   ├── page.tsx               list all forms
│   │   │   ├── [id]/page.tsx          fill in a form
│   │   │   └── [id]/results/page.tsx  view submissions
│   │   ├── builder/page.tsx           ← AI form builder UI
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── generated/prisma/          ← auto-generated Prisma client (don't edit)
│   ├── types/                 ← pure TypeScript types, no logic
│   │   ├── field.types.ts     ← FormField discriminated union
│   │   ├── form.types.ts      ← Form, DTOs
│   │   ├── api.types.ts       ← ApiResponse<T>
│   │   └── index.ts           ← barrel re-export
│   ├── lib/                   ← business logic, no React
│   │   ├── ai/generate-form.ts        ← calls Claude API
│   │   ├── db/
│   │   │   ├── prisma.ts              ← singleton PrismaClient
│   │   │   └── forms.repository.ts    ← DB queries
│   │   └── validators/
│   │       ├── field.validators.ts    ← Zod schemas for fields
│   │       └── form.validators.ts     ← Zod schema for create-form body
│   ├── components/
│   │   ├── fields/            ← one component per field kind
│   │   │   ├── TextField.tsx
│   │   │   ├── NumberField.tsx
│   │   │   ├── SelectField.tsx
│   │   │   ├── CheckboxField.tsx
│   │   │   ├── DateField.tsx
│   │   │   └── index.ts       ← barrel export
│   │   ├── builder/
│   │   │   ├── FormBuilder.tsx
│   │   │   └── FieldPreview.tsx
│   │   └── ui/                ← shadcn/ui components (auto-generated)
│   └── hooks/
│       ├── useFormBuilder.ts
│       └── useFormSubmission.ts
```

---

## Architecture: Layer Rules

The codebase is split into strict layers. Imports only flow **downward** — a lower layer never knows about a higher one.

```
types/       ← no imports from anywhere in the project
    ↓
lib/         ← imports from types/  only
    ↓
components/  ← imports from types/ and lib/
    ↓
app/api/     ← imports from lib/ only (thin HTTP adapter)
app/pages/   ← imports from components/ and lib/
```

**Why this matters:** If `lib/` imported from `app/`, you'd create a circular dependency and mix HTTP concerns into business logic. The strict direction means every layer is independently testable.

---

## Data Flow: Generating a Form

```
Browser              Next.js server          Anthropic API
  │                       │                       │
  │  POST /api/generate   │                       │
  │  { prompt: "..." }    │                       │
  │──────────────────────►│                       │
  │                       │  messages.create()    │
  │                       │──────────────────────►│
  │                       │                       │  generates JSON
  │                       │◄──────────────────────│
  │                       │  parse unknown → type guard → FormField[]
  │◄──────────────────────│
  │  { ok: true, data: FormField[] }
```

## Data Flow: Submitting a Form

```
Browser              Next.js server          SQLite DB
  │                       │                       │
  │  POST /api/submissions │                      │
  │  { formId, data }     │                       │
  │──────────────────────►│                       │
  │                       │  prisma.submission.create()
  │                       │──────────────────────►│
  │◄──────────────────────│◄──────────────────────│
  │  { ok: true, data: null }
```

---

## Key Design Decisions

### 1. SQLite as JSON store for fields
Form fields are stored as a JSON string (`fields String @default("[]")`). This avoids a complex relational schema for what is essentially a dynamic, schema-less structure. When reading, you parse the string; when writing, you serialize to JSON.

### 2. Prisma 7 driver adapter
Prisma 7 removed built-in database drivers. You must now provide a driver adapter. For SQLite we use `@prisma/adapter-better-sqlite3`. The `PrismaClient` is created with `new PrismaClient({ adapter })` instead of the older zero-argument form.

### 3. Global singleton for PrismaClient
Next.js in dev mode hot-reloads modules, which would create a new `PrismaClient` on every file change and exhaust the SQLite connection pool. The singleton pattern (`globalForPrisma.prisma ?? makePrisma()`) stores the instance on `globalThis` so it survives hot reloads.

### 4. `unknown` over `any` for AI responses
The Claude API returns `string`, which we `JSON.parse()` into `unknown`. We then narrow it with type guards before treating it as `FormField[]`. This forces the error path to be explicit rather than silently propagating bad data.
