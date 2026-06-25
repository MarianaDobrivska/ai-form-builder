# Documentation

## Reading Order

If you're new to the project, read in this order:

1. [overview.md](overview.md) — what we're building, architecture rules, data flows
2. [typescript.md](typescript.md) — every TypeScript feature used in this project, explained from scratch
3. [types.md](types.md) — the actual types defined: `FormField`, `Form`, `ApiResponse<T>`
4. [database.md](database.md) — Prisma 7 setup, schema, migrations, singleton pattern
5. [validators.md](validators.md) — Zod schemas and how runtime validation connects to TypeScript types
6. [api.md](api.md) — all API routes, request/response shapes, Next.js 16 conventions
7. [components.md](components.md) — field components, builder components, shadcn/ui
8. [hooks.md](hooks.md) — `useFormBuilder` and `useFormSubmission`
9. [ai-integration.md](ai-integration.md) — Claude API integration, prompt, response parsing

## By Topic

| Topic | Document |
|---|---|
| Architecture, folder structure | [overview.md](overview.md) |
| TypeScript learning | [typescript.md](typescript.md) |
| `FormField`, `ApiResponse<T>` | [types.md](types.md) |
| Prisma schema, SQLite, migrations | [database.md](database.md) |
| Zod validation | [validators.md](validators.md) |
| API routes, HTTP layer | [api.md](api.md) |
| React components | [components.md](components.md) |
| `useFormBuilder`, `useFormSubmission` | [hooks.md](hooks.md) |
| Claude API, AI form generation | [ai-integration.md](ai-integration.md) |

## Key Concepts Index

| Concept | Where explained |
|---|---|
| Discriminated union | [typescript.md §2](typescript.md#2-discriminated-unions), [types.md](types.md) |
| `unknown` vs `any` | [typescript.md §9](typescript.md#9-unknown-vs-any) |
| Generic types | [typescript.md §4](typescript.md#4-generic-types) |
| Conditional types | [typescript.md §3](typescript.md#3-conditional-types) |
| Utility types (Pick, Omit, Partial, Record) | [typescript.md §5](typescript.md#5-utility-types) |
| Type guards | [typescript.md §6](typescript.md#6-type-guards) |
| Exhaustive switch + `never` | [typescript.md §7](typescript.md#7-the-never-type-and-exhaustive-switches) |
| Prisma 7 breaking changes | [database.md](database.md#prisma-7-breaking-changes) |
| Zod parse vs safeParse | [validators.md](validators.md#parse-vs-safeparse) |
| Controlled components | [components.md](components.md#controlled-vs-uncontrolled) |
| Singleton PrismaClient | [database.md](database.md#prisma-client-singleton) |
| `use client` directive | [components.md](components.md#use-client-directive) |
| Next.js 16 async params | [api.md](api.md#get-apiformsid) |
