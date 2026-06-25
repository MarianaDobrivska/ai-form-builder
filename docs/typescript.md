# TypeScript Guide

This document explains every TypeScript pattern used in this project. It is written as a learning resource — each concept is explained from first principles, then shown in the actual code.

---

## 1. Strict Mode Flags

`tsconfig.json` enables a set of extra checks beyond just `strict: true`:

```json
{
  "strict": true,                      // enables: noImplicitAny, strictNullChecks, strictFunctionTypes, etc.
  "noUncheckedIndexedAccess": true,    // array[0] has type T | undefined, not T
  "exactOptionalPropertyTypes": true,  // { a?: string } means a can be absent, but NOT set to undefined
  "noImplicitReturns": true,           // every code path in a function must return a value
  "noFallthroughCasesInSwitch": true   // every switch case must break/return/throw
}
```

### `noUncheckedIndexedAccess` in practice

Without this flag:
```typescript
const arr = ['a', 'b', 'c']
const first = arr[0]  // TypeScript says: string
first.toUpperCase()   // ← no error, but arr[0] could be undefined at runtime
```

With this flag enabled:
```typescript
const arr = ['a', 'b', 'c']
const first = arr[0]  // TypeScript says: string | undefined
first.toUpperCase()   // ← compile error! Must guard first
if (first) first.toUpperCase()  // ✓
```

### `exactOptionalPropertyTypes` in practice

```typescript
type Config = { debug?: boolean }

// WITHOUT this flag, both are allowed:
const a: Config = { debug: undefined }  // "I set it to undefined"
const b: Config = {}                    // "I didn't set it"

// WITH this flag, only the absent form is allowed:
const a: Config = { debug: undefined }  // ← error! undefined is not boolean
const b: Config = {}                    // ✓
```

---

## 2. Discriminated Unions

This is the most important pattern in the project. Instead of a class hierarchy, we use a union of plain object types, each with a `kind` property that TypeScript uses as a "tag".

```typescript
// src/types/field.types.ts

type BaseField = {
  id: string
  label: string
  required: boolean
  readonly?: boolean
}

type TextField     = BaseField & { kind: 'text';     minLength?: number; maxLength?: number }
type NumberField   = BaseField & { kind: 'number';   min?: number; max?: number }
type SelectField   = BaseField & { kind: 'select';   options: readonly string[] }
type CheckboxField = BaseField & { kind: 'checkbox'; defaultChecked?: boolean }
type DateField     = BaseField & { kind: 'date';     minDate?: string; maxDate?: string }

type FormField = TextField | NumberField | SelectField | CheckboxField | DateField
```

### The `&` (intersection) operator

`TextField = BaseField & { kind: 'text'; ... }` means "an object that has ALL properties from BaseField AND all properties from the right side". It merges the two shapes.

Think of `&` as "AND" — a `TextField` must satisfy both shapes simultaneously.

### The `|` (union) operator

`FormField = TextField | NumberField | ...` means "a value that can be any one of these types".

Think of `|` as "OR" — a `FormField` is a TextField OR a NumberField OR ...

### Why `kind` is the discriminant

When TypeScript sees a switch on `field.kind`, it narrows the type in each branch:

```typescript
function renderField(field: FormField) {
  switch (field.kind) {
    case 'text':
      // TypeScript KNOWS field is TextField here
      // field.minLength is accessible, field.options is NOT
      return <TextField field={field} />

    case 'select':
      // TypeScript KNOWS field is SelectField here
      // field.options is accessible
      return <SelectField field={field} />
  }
}
```

Without the discriminant, TypeScript couldn't narrow — you'd have to use `instanceof` or write type guard functions for every branch.

### Why this beats a class hierarchy

```typescript
// Class approach (not used here):
class Field { id: string; label: string }
class TextField extends Field { minLength?: number }

// Problems:
// - You can't easily serialize/deserialize instances (JSON.parse gives plain objects)
// - AI responses are plain objects, not class instances
// - You'd need factory functions everywhere

// Discriminated union approach (what we use):
// - Plain objects → trivially JSON serializable
// - AI can return them directly
// - TypeScript narrows automatically via the `kind` tag
```

---

## 3. Conditional Types

```typescript
// src/types/field.types.ts

type FieldValue<T extends FormField> =
  T extends TextField     ? string  :
  T extends NumberField   ? number  :
  T extends CheckboxField ? boolean :
  T extends SelectField   ? T['options'][number] :
  T extends DateField     ? string  :
  never
```

This is a **conditional type** — TypeScript's equivalent of a ternary (`? :`) but evaluated at the type level, not at runtime.

Read it as: "If T is a TextField, the value type is string. If T is a NumberField, the value type is number. ..."

### The `extends` keyword in conditionals

In `T extends TextField ? string : ...`, `extends` does NOT mean inheritance. It means "is assignable to" or "is a subset of". Here it's asking: "does T have all the properties of TextField?"

### Indexed access: `T['options'][number]`

`T['options']` gives you the type of the `options` property of `T`. Since `options: readonly string[]`, this gives you `readonly string[]`.

`(readonly string[])[number]` gives you the type of any element of that array — which is `string`.

But if `options` were `readonly ['red', 'green', 'blue']` (a tuple), then `T['options'][number]` would give you the literal union `'red' | 'green' | 'blue'`. TypeScript would then catch a typo like `value = 'purple'` at compile time.

### The `never` type

`never` represents the empty type — a value that can never exist. It is used here as the fallback for the "impossible" case (a FormField that isn't any of the known kinds). Since `FormField` is a closed union, `never` here is unreachable — it exists to make the type exhaustive.

---

## 4. Generic Types

A **generic** is a type with a parameter — like a function, but for types.

```typescript
// src/types/api.types.ts

type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code: number }
```

`T` is the type parameter. When you use the type, you fill it in:

```typescript
type FormsResponse    = ApiResponse<FormPreview[]>
// = { ok: true; data: FormPreview[] } | { ok: false; error: string; code: number }

type GenerateResponse = ApiResponse<FormField[]>
// = { ok: true; data: FormField[] } | { ok: false; error: string; code: number }
```

### Generic constraints: `T extends FormField`

```typescript
type FieldValue<T extends FormField> = ...
```

`T extends FormField` is a **constraint** — it says "T can be any type, but it must be assignable to FormField". You can't call `FieldValue<string>` because `string` doesn't extend `FormField`.

### Why generics beat `any` here

```typescript
// With any:
type ApiResponse = { ok: true; data: any } | { ok: false; error: string; code: number }

// Problem: data is any — TypeScript can't help you use it safely
const res: ApiResponse = ...
res.data.nonExistentMethod()  // no error!

// With generics:
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; code: number }

const res: ApiResponse<FormField[]> = ...
res.data.nonExistentMethod()  // ← compile error! TypeScript knows data is FormField[]
```

---

## 5. Utility Types

TypeScript ships built-in "type functions" called utility types. We use four:

### `Pick<T, Keys>` — keep only some properties

```typescript
// src/types/form.types.ts

type FormPreview = Pick<Form, 'id' | 'title' | 'createdAt'> & { fieldCount: number }
```

`Pick<Form, 'id' | 'title' | 'createdAt'>` creates a new type with only those three fields from `Form`. We then add `fieldCount` with `&`.

**Why:** The list endpoint returns a lightweight preview, not the full form with all field definitions. `Pick` enforces at the type level that we can't accidentally include fields we didn't intend to.

### `Omit<T, Keys>` — remove some properties

```typescript
type FormDraft = Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>
```

`Omit<Form, 'id' | 'createdAt' | 'updatedAt'>` gives you `Form` without the server-generated fields (id and timestamps). You'd use `FormDraft` when building a form before saving it.

### `Partial<T>` — make all properties optional

`Partial<Omit<Form, ...>>` makes every remaining property optional. A draft might have a title but no fields yet.

```typescript
const draft: FormDraft = {}            // ✓ everything optional
const draft: FormDraft = { title: 'x' } // ✓ partial
```

### `Record<K, V>` — object with specific key and value types

```typescript
// src/hooks/useFormSubmission.ts

async function submit(data: Record<string, unknown>) { ... }
```

`Record<string, unknown>` is equivalent to `{ [key: string]: unknown }`. It says "an object where keys are strings and values are anything (but safely, as `unknown` not `any`)".

**Why `unknown` and not `any`?** With `any` you can call methods on the values without checking. With `unknown` you must narrow the type before using it — forcing you to be explicit about what the data contains.

---

## 6. Type Guards

A **type guard** is a function that returns `boolean` AND tells TypeScript to narrow the type when it returns `true`.

```typescript
// Pattern (not yet in the code, but the project will need this):
function isTextField(field: FormField): field is TextField {
  return field.kind === 'text'
}

// Usage:
if (isTextField(field)) {
  // TypeScript knows field is TextField here
  field.minLength  // ✓ accessible
}
```

The return type `field is TextField` is called a **type predicate**. It's the signal to TypeScript that this function narrows the type.

### Type narrowing without a guard function

You don't always need a separate function. TypeScript narrows automatically with `typeof`, `instanceof`, and property checks:

```typescript
const parsed: unknown = JSON.parse(text)

if (!Array.isArray(parsed)) throw new Error('Expected array')
// After this line, TypeScript knows parsed is an array (but not what's in it)

// src/lib/ai/generate-form.ts uses this pattern:
const parsed: unknown = JSON.parse(content.text)
if (!Array.isArray(parsed)) throw new Error('Expected array from AI')
return parsed as FormField[]  // ← we still need `as` here (explained below)
```

### The one acceptable use of `as`

Normally the rule is "no `as` casts". But after narrowing `unknown` to an array, TypeScript still doesn't know the element types. We've already verified structure with `Array.isArray`, so the cast `as FormField[]` is acceptable here — we're taking runtime responsibility for what the AI returned.

A stricter approach would be to run `formFieldSchema.parse()` from Zod on each element, which would validate at runtime too. That's the next evolution.

---

## 7. The `never` Type and Exhaustive Switches

`never` is used as a compile-time safety net for switch statements:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unhandled field kind: ${JSON.stringify(x)}`)
}

function renderField(field: FormField) {
  switch (field.kind) {
    case 'text':     return <TextField ... />
    case 'number':   return <NumberField ... />
    case 'select':   return <SelectField ... />
    case 'checkbox': return <CheckboxField ... />
    case 'date':     return <DateField ... />
    default:         return assertNever(field)
  }
}
```

After all five `case` branches, TypeScript knows `field` has been narrowed to `never` (there are no remaining possibilities). So `assertNever(field)` compiles cleanly.

**If you add a new field kind** (e.g. `RatingField` with `kind: 'rating'`) and forget to add a case, TypeScript will error at `assertNever(field)` with: "Argument of type 'RatingField' is not assignable to parameter of type 'never'." This is the compile-time safety net — you can't forget to handle a new variant.

---

## 8. `import type`

```typescript
import type { FormField } from '@/types'
```

`import type` tells TypeScript (and the bundler) that this import is only used as a type, never as a value at runtime. Benefits:

- The import is completely erased from the compiled JavaScript — zero runtime cost
- Avoids circular import issues in some edge cases
- Makes it explicit to readers that `FormField` is only used for type checking

Rule of thumb: use `import type` for anything from `src/types/`, and for React component prop types.

---

## 9. `unknown` vs `any`

| | `any` | `unknown` |
|---|---|---|
| Assignable to anything? | yes | no |
| Can call methods on it? | yes (unsafe) | no (must narrow first) |
| Good for | legacy code escape hatch | safe external data |

```typescript
// any — TypeScript disables checking
const data: any = JSON.parse(response)
data.foo.bar.baz()  // no error, even if this crashes at runtime

// unknown — TypeScript forces you to check
const data: unknown = JSON.parse(response)
data.foo  // ← error! Object is of type 'unknown'

if (typeof data === 'object' && data !== null && 'foo' in data) {
  // Now you can access data.foo
}
```

Every external boundary in this project uses `unknown`:
- API request bodies: `const raw: unknown = await request.json()`
- AI responses: `const parsed: unknown = JSON.parse(content.text)`

---

## 10. Readonly

```typescript
type SelectField = BaseField & { kind: 'select'; options: readonly string[] }
```

`readonly string[]` means the array cannot be mutated — no `push`, `pop`, `splice`. The elements can still be read.

This matters because `options` comes from the AI and should never be mutated by the UI. Marking it `readonly` makes that constraint enforceable at compile time.

```typescript
field.options.push('new option')  // ← compile error! Cannot add to readonly array
field.options[0]                  // ✓ reading is fine
```

---

## 11. Path Aliases

```json
// tsconfig.json
{
  "paths": { "@/*": ["./src/*"] },
  "baseUrl": "."
}
```

`@/types` resolves to `src/types`, `@/lib/db/prisma` resolves to `src/lib/db/prisma`, etc.

**Why:** Without aliases you'd have relative paths like `../../../lib/db/prisma`, which break when you move files and are hard to read.

---

## TypeScript Features at a Glance

| Feature | Where used | What it does |
|---|---|---|
| Discriminated union | `FormField` | Safe union with a `kind` tag for narrowing |
| Intersection `&` | `TextField = BaseField & {...}` | Merges two object shapes |
| Generic type | `ApiResponse<T>` | Parameterized type |
| Generic constraint | `T extends FormField` | Restricts what T can be |
| Conditional type | `FieldValue<T>` | Type-level ternary |
| Indexed access | `T['options'][number]` | Gets the type of an array element |
| `Pick` utility | `FormPreview` | Subset of a type |
| `Omit` utility | `FormDraft` | Remove properties from a type |
| `Partial` utility | `FormDraft` | Make all properties optional |
| `Record` utility | `submit(data)` | Object with typed keys and values |
| Type guard | `isTextField` | Narrows a union type |
| Type predicate | `field is TextField` | Return type that signals narrowing |
| `never` + assertNever | `renderField` switch | Exhaustive case checking |
| `import type` | all type imports | Erased at runtime, zero cost |
| `unknown` | API/AI boundaries | Safe external data |
| `readonly` | `options` array | Immutable at compile time |
| Strict flags | `tsconfig.json` | Extra safety: noUncheckedIndexedAccess, etc. |
