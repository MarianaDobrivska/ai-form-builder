# Database

## Stack

- **Prisma 7** — ORM (Object-Relational Mapper): maps database rows to TypeScript objects
- **SQLite** — a file-based SQL database; the entire DB is a single file (`prisma/dev.db`)
- **`@prisma/adapter-better-sqlite3`** — the driver adapter Prisma 7 requires for SQLite

---

## Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/app/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Form {
  id          String       @id @default(cuid())
  title       String
  description String?
  fields      String       @default("[]")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  submissions Submission[]
}

model Submission {
  id        String   @id @default(cuid())
  formId    String
  data      String
  createdAt DateTime @default(now())
  form      Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
}
```

### Schema annotations explained

| Annotation | Meaning |
|---|---|
| `@id` | This is the primary key |
| `@default(cuid())` | Generate a collision-resistant unique ID automatically |
| `@default(now())` | Set to current timestamp on insert |
| `@updatedAt` | Automatically updated to current timestamp on every update |
| `String?` | The `?` makes the column nullable (can be NULL in the database) |
| `@default("[]")` | Default value if not provided |
| `Submission[]` | A relation: one Form has many Submissions |
| `onDelete: Cascade` | When a Form is deleted, all its Submissions are deleted too |

### Why fields are stored as JSON string

```prisma
fields String @default("[]")
```

Form fields (`FormField[]`) are stored as a JSON string, not as a separate table. This is a deliberate trade-off:

**Pro:** No complex relational schema needed for a dynamically-shaped structure. Adding a new field kind doesn't require a database migration.

**Con:** You can't query individual field properties in SQL. Acceptable here because we always load the full form.

When reading: `const fields: FormField[] = JSON.parse(form.fields)`
When writing: `fields: JSON.stringify(fieldsArray)`

### The `cuid()` ID

`cuid` (Collision-resistant Unique Identifier) generates IDs like `clu4z9x0k0000vlk4w2h8r5q4`. Advantages over auto-increment integers:

- Safe to generate on the client (no DB round-trip needed)
- Doesn't expose record counts (attacker can't infer "there are 5000 users")
- Sortable (prefixed with a timestamp component)

---

## Prisma 7: Breaking Changes

Prisma 7 introduced two major changes from Prisma 5:

### 1. Database URL moved out of schema

In Prisma 5, the database URL lived in `schema.prisma`:
```prisma
// Old (Prisma 5):
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

In Prisma 7, this is an error. The URL must be in `prisma.config.ts`:
```typescript
// New (Prisma 7) — prisma.config.ts:
export default defineConfig({
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db',
  },
})
```

### 2. Driver adapters are now required

In Prisma 5, the ORM had built-in database drivers. In Prisma 7, all drivers were removed — you must bring your own via an adapter.

For SQLite, we use `@prisma/adapter-better-sqlite3`:
```typescript
// src/lib/db/prisma.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/app/generated/prisma/client'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })
```

### 3. PrismaClient import path changed

In Prisma 5, you always imported from `@prisma/client`. In Prisma 7, when you specify a custom `output` path in the schema, you import from that generated path:

```typescript
// Old:
import { PrismaClient } from '@prisma/client'

// New (custom output in schema.prisma):
import { PrismaClient } from '@/app/generated/prisma/client'
```

---

## Prisma Config (`prisma.config.ts`)

```typescript
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db',
  },
})
```

`import 'dotenv/config'` loads `.env` so `process.env['DATABASE_URL']` is available. The `??` operator provides a fallback if the variable is not set.

---

## Prisma Client Singleton (`src/lib/db/prisma.ts`)

```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/app/generated/prisma/client'

const dbUrl = process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db'

function makePrisma() {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Why the singleton pattern

Next.js hot-reloads modules in development. Without this pattern, every file save would create a new `PrismaClient` instance — each holding a database connection. Eventually the connection pool is exhausted and queries start failing.

The solution: store the instance on `globalThis`. `globalThis` is not reloaded on hot-reloads (only modules are). So:
- First load: `globalForPrisma.prisma` is `undefined` → `makePrisma()` creates it → stored on `globalForPrisma`
- Subsequent hot-reloads: `globalForPrisma.prisma` is already set → reused

In production, modules are only loaded once, so the guard `if (process.env.NODE_ENV !== 'production')` is technically unnecessary, but it's a common convention to skip the global assignment in production.

### The TypeScript cast

```typescript
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
```

`globalThis` is typed as `typeof globalThis`, which doesn't have a `prisma` property. We can't add to it directly. The double cast `as unknown as { prisma?: PrismaClient }` works in two steps:
1. `as unknown` — widens to `unknown` (safe, everything is `unknown`)
2. `as { prisma?: PrismaClient }` — narrows to our custom shape

This is the one place a double cast is justified: we're extending a well-known global object with a custom property, which is a standard Node.js singleton pattern.

---

## Repository (`src/lib/db/forms.repository.ts`)

```typescript
import { prisma } from './prisma'
import type { FormPreview } from '@/types'

export async function getAllForms(): Promise<FormPreview[]> {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return forms.map((f) => ({
    id: f.id,
    title: f.title,
    createdAt: f.createdAt,
    fieldCount: 0,
  }))
}
```

The **repository pattern** isolates all database queries in one place. API routes call repository functions, never the Prisma client directly. Benefits:

- Easy to swap the database later — change only this file
- Easy to mock in tests — mock the repository function, not Prisma internals
- Keeps API routes thin and focused on HTTP concerns

`fieldCount: 0` is a placeholder — the actual implementation will count related Submission records or parse the `fields` JSON string to get the array length.

---

## Migrations

Migrations are SQL files that describe schema changes over time. They live in `prisma/migrations/`.

```bash
# Create and apply a new migration:
npx prisma migrate dev --name add_user_id

# Apply pending migrations (CI/production):
npx prisma migrate deploy

# Reset the DB and re-apply all migrations (dev only!):
npx prisma migrate reset
```

The initial migration (`prisma/migrations/20260529.../migration.sql`) was generated from our schema and creates the `Form` and `Submission` tables.

**Never edit migration files manually.** Change `schema.prisma` and let Prisma generate the migration SQL.

---

## Useful Commands

```bash
npx prisma studio          # open a browser GUI to view/edit data
npx prisma generate        # regenerate the TypeScript client after schema changes
npx prisma migrate dev     # apply pending migrations in dev
npx prisma db push         # push schema without migrations (quick prototyping only)
```
