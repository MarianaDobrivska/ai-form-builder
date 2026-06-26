# TypeScript Features

The TypeScript patterns used across this project, with examples from the actual
code. File paths point at where each pattern lives.

## Strict compiler flags

`tsconfig.json` turns on extra checks beyond `strict: true`:

```jsonc
{
  "strict": true,                     // noImplicitAny, strictNullChecks, ...
  "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined, not T
  "exactOptionalPropertyTypes": true, // { a?: string } can be absent, not = undefined
  "noImplicitReturns": true,          // every path must return
  "noFallthroughCasesInSwitch": true  // each case must break/return/throw
}
```

`noUncheckedIndexedAccess` shows up everywhere we read a dynamic value, e.g.
`values[field.id]` in `FieldInput` is `FieldValue | undefined`, which forces the
`typeof` checks before passing it to a control.

`exactOptionalPropertyTypes` is why a few boundaries are written carefully — see
[type guards](#type-guards--predicates) and [Zod inference](#zod-schema-inference) below.

## Discriminated unions

The core modelling tool. A union of object types, each tagged with a literal
discriminant the compiler uses to narrow.

**Form fields** — `src/types/field.types.ts`:

```ts
type TextField     = BaseField & { kind: 'text';     minLength?: number; maxLength?: number }
type NumberField   = BaseField & { kind: 'number';   min?: number; max?: number }
type SelectField   = BaseField & { kind: 'select';   options: readonly string[] }
type CheckboxField = BaseField & { kind: 'checkbox'; defaultChecked?: boolean }
type DateField     = BaseField & { kind: 'date';     minDate?: string; maxDate?: string }

export type FormField = TextField | NumberField | SelectField | CheckboxField | DateField
```

The same shape models **async state machines**, so each state carries exactly the
data it needs and impossible combinations are unrepresentable:

```ts
// src/types/form.types.ts — generation
export type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; fields: FormField[] }
  | { status: 'error'; message: string }

// src/hooks/useFormSubmission.ts — submission (similar SaveState in useSaveForm.ts)
type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string }
```

And the API contract — `src/types/api.types.ts`:

```ts
export type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code: number }
```

## Exhaustive switch + `assertNever`

Rendering a `FormField` switches on `kind`; the `default` branch passes the value
to `assertNever`, whose parameter is `never`. Once all cases are handled, the value
is narrowed to `never` and it compiles. Add a new field kind without a case and
this becomes a **compile error** — `src/components/fields/FieldInput.tsx`:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled field kind: ${JSON.stringify(x)}`)
}

switch (field.kind) {
  case 'text':     return <TextField ... />
  case 'number':   return <NumberField ... />
  case 'select':   return <SelectField ... />
  case 'checkbox': return <CheckboxField ... />
  case 'date':     return <DateField ... />
  default:         return assertNever(field)
}
```

## Conditional types

A type-level ternary that maps each field type to the type of value it holds —
`src/types/field.types.ts`:

```ts
export type FieldValue<T extends FormField> =
  T extends TextField     ? string  :
  T extends NumberField   ? number  :
  T extends CheckboxField ? boolean :
  T extends SelectField   ? T['options'][number] :  // indexed access → element type
  T extends DateField     ? string  :
  never
```

`T['options'][number]` is **indexed access**: the element type of the `options`
array. With a tuple of literals it would narrow to a union of those literals.

## Generics & constraints

- `ApiResponse<T>` parameterises the success payload, so `ApiResponse<FormField[]>`
  and `ApiResponse<FormPreview[]>` stay fully typed instead of `any`.
- `FieldValue<T extends FormField>` constrains `T` so you can't call it with an
  unrelated type.

## Utility types

```ts
// src/types/form.types.ts
type FormPreview = Pick<Form, 'id' | 'title' | 'createdAt'> & { fieldCount: number }
type FormDraft   = Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>

// submission payloads — an object with string keys and safe `unknown` values
data: Record<string, unknown>
```

## Zod schema inference

Schemas are the single runtime source of truth, and their static types are derived
with `z.infer` rather than written twice — `src/lib/validators/form.validators.ts`:

```ts
export const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, 'A form needs at least one field'),
})

export type CreateFormInput = z.infer<typeof createFormSchema>
```

`createForm()` accepts `CreateFormInput` directly. This also sidesteps an
`exactOptionalPropertyTypes` mismatch: Zod infers optional props as `T | undefined`,
which doesn't assign to a hand-written `{ x?: T }`, so we consume the inferred type
at the boundary. Fields use a `discriminatedUnion` keyed on `kind`
(`src/lib/validators/field.validators.ts`), mirroring the `FormField` type.

## Type guards & predicates

A function returning `value is X` narrows the type when it returns `true`. We use
guards (never `as` casts) to cross untyped boundaries.

`isFormFieldArray` validates parsed JSON at runtime via Zod while narrowing the
static type — `src/lib/validators/field.validators.ts`:

```ts
export function isFormFieldArray(value: unknown): value is FormField[] {
  return z.array(formFieldSchema).safeParse(value).success
}
```

It's reused everywhere field data crosses a boundary: the AI response
(`src/lib/ai/generate-form.ts`), the fetch response in `useFormBuilder`, and the
stored DB column in `getFormById`. A small `isRecord` guard (`src/lib/utils.ts`)
narrows parsed JSON to an object before reading properties.

> The predicate form is deliberate: returning Zod's inferred type would clash with
> the hand-written `FormField` under `exactOptionalPropertyTypes`, so the guard
> validates at runtime and asserts the narrowing — no `as`.

## Custom error class + `instanceof` narrowing

`FormGenerationError` carries a user-safe message and an HTTP status; the route
narrows on it with `instanceof` to surface real messages —
`src/lib/ai/generate-form.ts` and `src/app/api/generate/route.ts`:

```ts
export class FormGenerationError extends Error {
  readonly status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'FormGenerationError'
    this.status = status
  }
}

// route:
if (error instanceof FormGenerationError)
  return NextResponse.json({ ok: false, error: error.message, code: error.status }, { status: error.status })
```

## `unknown` over `any` at every boundary

External data starts as `unknown` and must be narrowed before use:

```ts
const raw: unknown = await request.json()      // API request bodies
const parsed: unknown = JSON.parse(text)        // AI output / DB JSON columns
const json: unknown = await res.json()          // client fetch responses
```

## `readonly`

`SelectField.options: readonly string[]` — option lists come from the AI and the UI
must not mutate them; `push`/`splice` become compile errors.

## `import type`

Type-only imports (e.g. `import type { FormField } from '@/types'`) are erased from
the emitted JS — zero runtime cost and clearer intent. Used for everything out of
`src/types/` and for component prop types.

## Path aliases

`tsconfig.json` maps `@/*` → `./src/*`, so imports read `@/lib/db/prisma` instead of
`../../../lib/db/prisma`.

## At a glance

| Feature | Example | Where |
|---|---|---|
| Discriminated union | `FormField`, `GenerationState`, `ApiResponse<T>` | `types/`, hooks |
| Exhaustive switch + `assertNever` | field renderer | `components/fields/FieldInput.tsx` |
| Conditional + indexed-access type | `FieldValue<T>` | `types/field.types.ts` |
| Generics + constraints | `ApiResponse<T>`, `FieldValue<T extends FormField>` | `types/` |
| Utility types | `Pick`, `Omit`, `Partial`, `Record` | `types/form.types.ts` |
| Zod inference | `z.infer<typeof createFormSchema>` | `lib/validators/` |
| Type guards / predicates | `isFormFieldArray`, `isRecord` | `lib/validators/`, `lib/utils.ts` |
| Custom error + `instanceof` | `FormGenerationError` | `lib/ai/`, `app/api/generate` |
| `unknown` at boundaries | request/AI/DB/fetch parsing | throughout |
| `readonly` | `SelectField.options` | `types/field.types.ts` |
| `import type` | type-only imports | throughout |
| Strict flags | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, … | `tsconfig.json` |
