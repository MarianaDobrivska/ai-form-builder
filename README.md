# AI Form Builder

Describe a form in natural language → AI generates it → share it → collect responses → review results.

Built with **Next.js 16** (App Router), **TypeScript** (strict), **Prisma + SQLite**, the **Anthropic Claude** API, **Tailwind CSS** + **shadcn/ui**, and **Zod**.

## Features

- **Generate** a form from a plain-language prompt (`/builder`), powered by `claude-haiku-4-5`.
- **Preview & test** the generated form, then **save** it with one click.
- **Browse** saved forms (`/forms`).
- **Fill & share** a public form (`/forms/[id]`) with a copy-link button.
- **View responses** in a table (`/forms/[id]/results`).

## Getting Started

Install dependencies and set up the database:

```bash
npm install
npx prisma migrate dev
```

Create a `.env` file (see `.env.example`):

```bash
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."   # from https://console.anthropic.com
```

Run the dev server and open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

> The Anthropic API key is billed separately from a Claude.ai subscription (pay-as-you-go). `claude-haiku-4-5` costs roughly $0.001 per generation.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit` (run before every commit)
- `npm run lint` — ESLint check
- `npx prisma studio` — database GUI

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts          POST → AI generates fields
│   │   ├── forms/route.ts             GET list · POST create
│   │   ├── forms/[id]/route.ts        GET one · DELETE
│   │   └── submissions/route.ts       POST → save a response
│   ├── builder/page.tsx               generate + save a form
│   ├── forms/page.tsx                 browse saved forms
│   ├── forms/[id]/page.tsx            public fillable form
│   ├── forms/[id]/results/page.tsx    responses table
│   ├── layout.tsx                     root layout + global nav
│   └── page.tsx                       home
├── components/
│   ├── fields/   one component per field kind + FieldInput (the renderer)
│   ├── builder/  FormBuilder (interactive preview)
│   ├── form/     FormFiller, CopyLinkButton
│   ├── layout/   SiteHeader (home + back + nav)
│   └── ui/       shadcn/ui primitives
├── hooks/        useFormBuilder, useSaveForm, useFormSubmission
├── lib/
│   ├── ai/         generate-form.ts (Claude call + safe parsing)
│   ├── db/         prisma client, forms + submissions repositories
│   ├── validators/ Zod schemas + helpers
│   └── utils.ts
└── types/        pure TypeScript types (field, form, api)
```

## Architecture

Imports flow **downward** only — a lower layer never imports from a higher one:

```
types/   → pure types, no logic
lib/     → business logic (no React, no HTTP)
components/ + hooks/  → React, import from lib/ and types/
app/     → pages and thin API routes that delegate to lib/
```

Every API route follows the same `ApiResponse<T>` contract and treats input as `unknown` until validated with Zod. The AI response is never trusted directly — it's parsed and narrowed through a type guard.

## Documentation

- [docs/overview.md](docs/overview.md) — full project reference: architecture, database, API, and data flows.
- [docs/typescript-features.md](docs/typescript-features.md) — the TypeScript patterns used across the project, with examples.
- [CLAUDE.md](CLAUDE.md) and [.claude/](.claude) — conventions and architecture rules.
