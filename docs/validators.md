# Validators

Validators live in `src/lib/validators/`. They use **Zod** — a TypeScript-first schema validation library.

---

## What Zod Does

Zod validates data at **runtime** while TypeScript validates at **compile time**. You need both:

- TypeScript catches type errors in your own code at compile time
- Zod validates external data (API bodies, AI responses) at runtime, when TypeScript can't help

```typescript
// TypeScript knows nothing about what arrives over HTTP at runtime.
// The body could be anything: missing fields, wrong types, injected keys.
const raw: unknown = await request.json()

// Zod validates at runtime and throws ZodError if the shape is wrong:
const body = createFormSchema.parse(raw)
// After this line, body is typed as { title: string; description?: string; prompt: string }
// AND those types are guaranteed to be correct at runtime.
```

---

## Field Validators (`src/lib/validators/field.validators.ts`)

### Base schema

```typescript
const baseFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  readonly: z.boolean().optional(),
})
```

`z.object({})` creates a schema for a plain object. Each property maps to a Zod type.

`z.boolean().optional()` means the property can be absent. Zod's `.optional()` corresponds exactly to TypeScript's `?` property marker.

### Per-kind schemas

```typescript
export const textFieldSchema = baseFieldSchema.extend({
  kind: z.literal('text'),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
})
```

`.extend({})` creates a new schema that includes all properties of `baseFieldSchema` plus the added ones. This is the Zod equivalent of the TypeScript `& { ... }` intersection.

`z.literal('text')` matches exactly the string `'text'` — nothing else. This is the Zod equivalent of TypeScript's literal type `'text'`.

### Discriminated union schema

```typescript
export const formFieldSchema = z.discriminatedUnion('kind', [
  textFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  checkboxFieldSchema,
  dateFieldSchema,
])
```

`z.discriminatedUnion('kind', [...])` tells Zod to look at the `kind` property to decide which sub-schema to use. This is:
- **Fast:** Zod only tries the matching schema, not all of them
- **Clear errors:** "Expected 'text' | 'number' | ... but got 'rating'" instead of a wall of text

The parallel with TypeScript is exact:
```typescript
// TypeScript type:      FormField = TextField | NumberField | ...
// Zod schema:          formFieldSchema = z.discriminatedUnion('kind', [...])
```

### Inferred types

A useful feature of Zod: you can derive TypeScript types from schemas, avoiding duplication:

```typescript
import { z } from 'zod'

const textFieldSchema = z.object({ kind: z.literal('text'), label: z.string() })

// Infer the TypeScript type from the Zod schema:
type TextField = z.infer<typeof textFieldSchema>
// = { kind: 'text'; label: string }
```

In this project, we define types manually in `src/types/` and schemas separately in `src/lib/validators/`. Both describe the same shape — the types are the authoritative definition, and the schemas validate conformance at runtime. An alternative approach would be to define only the Zod schemas and use `z.infer<>` everywhere.

---

## Form Validators (`src/lib/validators/form.validators.ts`)

```typescript
export const createFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  prompt: z.string().min(1),
})
```

`z.string().min(1)` rejects empty strings. `"title": ""` would fail validation with "String must contain at least 1 character(s)".

---

## How Validation Is Used in API Routes

```typescript
// src/app/api/generate/route.ts

const generateSchema = z.object({ prompt: z.string().min(1) })

export async function POST(request: NextRequest) {
  try {
    const raw: unknown = await request.json()      // 1. receive as unknown
    const { prompt } = generateSchema.parse(raw)   // 2. validate and narrow
    const fields = await generateForm(prompt)       // 3. use the validated value
    return NextResponse.json({ ok: true, data: fields })
  } catch (error) {
    if (error instanceof z.ZodError)               // 4. catch validation errors
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```

Steps:
1. `await request.json()` → typed as `any` by Next.js → immediately assigned to `unknown`
2. `schema.parse(raw)` → validates at runtime; on failure throws `ZodError`; on success returns a fully typed value
3. Use the result — TypeScript knows the exact type, Zod guarantees it at runtime
4. `instanceof z.ZodError` narrows the caught `unknown` error — only Zod errors get a 400; everything else gets a 500

### `parse` vs `safeParse`

`schema.parse(data)` throws `ZodError` on failure.
`schema.safeParse(data)` returns `{ success: true, data } | { success: false, error: ZodError }`.

```typescript
const result = generateSchema.safeParse(raw)
if (!result.success) {
  console.log(result.error.issues)  // access error details without try/catch
  return ...
}
const { prompt } = result.data  // safely typed
```

Use `safeParse` when you need to inspect the errors in detail. Use `parse` when you want to propagate the error up to a catch block (our current approach).

---

## Zod API Quick Reference

| Zod method | Meaning |
|---|---|
| `z.string()` | must be a string |
| `z.number()` | must be a number |
| `z.boolean()` | must be a boolean |
| `z.literal('text')` | must be exactly `'text'` |
| `z.object({...})` | must be an object with these fields |
| `.optional()` | field may be absent |
| `.min(1)` | string at least 1 char / number >= 1 |
| `.max(100)` | string at most 100 chars / number <= 100 |
| `.extend({...})` | add fields to an existing object schema |
| `z.array(z.string())` | must be an array of strings |
| `z.record(z.string(), z.unknown())` | object with string keys, any values |
| `z.discriminatedUnion('kind', [...])` | union picked by a discriminant key |
| `z.infer<typeof schema>` | extract the TypeScript type |
