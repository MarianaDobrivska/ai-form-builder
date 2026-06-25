# Types

All types live in `src/types/`. They are pure TypeScript — no logic, no imports from other project layers.

---

## Field Types (`src/types/field.types.ts`)

### `BaseField`

```typescript
type BaseField = {
  id: string
  label: string
  required: boolean
  readonly?: boolean
}
```

The shared shape every field has. It is not exported because you never work with a raw `BaseField` — you always work with a specific kind.

`readonly?` uses `?` which makes the property **optional** (can be absent). If present, it must be `boolean`. With `exactOptionalPropertyTypes` enabled, setting it to `undefined` explicitly is an error — it must either be present as `true`/`false` or absent entirely.

### The Five Field Types

Each field type is `BaseField & { kind: '...'; ...specific props }`.

```typescript
type TextField = BaseField & {
  kind: 'text'
  minLength?: number
  maxLength?: number
}

type NumberField = BaseField & {
  kind: 'number'
  min?: number
  max?: number
}

type SelectField = BaseField & {
  kind: 'select'
  options: readonly string[]   // immutable list of choices
}

type CheckboxField = BaseField & {
  kind: 'checkbox'
  defaultChecked?: boolean
}

type DateField = BaseField & {
  kind: 'date'
  minDate?: string   // ISO date string: "2024-01-01"
  maxDate?: string
}
```

### `FormField`

```typescript
type FormField = TextField | NumberField | SelectField | CheckboxField | DateField
```

The union type. Any function that works with "a field" accepts `FormField`. TypeScript narrows it to the specific kind when you check `field.kind`.

### `FieldKind`

```typescript
type FieldKind = FormField['kind']
// equivalent to: 'text' | 'number' | 'select' | 'checkbox' | 'date'
```

**Indexed access type** — `FormField['kind']` extracts the type of the `kind` property from the union. Because each member of the union has a different literal string as `kind`, the result is a union of all those strings.

Use this type wherever you need "the name of a field kind" without hard-coding the strings:
```typescript
const FIELD_LABELS: Record<FieldKind, string> = {
  text: 'Text Input',
  number: 'Number Input',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  date: 'Date Picker',
}
```

If you add a new field kind later, TypeScript will error on `FIELD_LABELS` until you add the new entry. That's the exhaustiveness guarantee.

### `FieldValue<T>`

```typescript
type FieldValue<T extends FormField> =
  T extends TextField     ? string  :
  T extends NumberField   ? number  :
  T extends CheckboxField ? boolean :
  T extends SelectField   ? T['options'][number] :
  T extends DateField     ? string  :
  never
```

A **conditional type** that maps a field type to its value type at the TypeScript level.

Examples:
```typescript
type TextValue     = FieldValue<TextField>      // string
type NumberValue   = FieldValue<NumberField>    // number
type CheckboxValue = FieldValue<CheckboxField>  // boolean
```

The `SelectField` case — `T['options'][number]` — is especially powerful: if the options are typed as a literal tuple `readonly ['red', 'green']`, then `FieldValue<SelectField>` becomes `'red' | 'green'`, and TypeScript catches invalid values.

---

## Form Types (`src/types/form.types.ts`)

### `Form` — the domain model

```typescript
type Form = {
  id: string
  title: string
  description?: string
  fields: FormField[]
  createdAt: Date
  updatedAt: Date
}
```

The internal representation of a form. This type is used inside the application — it is never directly serialized to the API (the DTO types below are used for that).

`description?` — optional property. A form may or may not have a description.

### `FormPreview`

```typescript
type FormPreview = Pick<Form, 'id' | 'title' | 'createdAt'> & { fieldCount: number }
```

A lightweight view used in list endpoints. Instead of returning all field definitions, the list API returns just enough to render a card: the title, ID, creation date, and the count of fields.

`Pick<Form, 'id' | 'title' | 'createdAt'>` is expanded by TypeScript to:
```typescript
{
  id: string
  title: string
  createdAt: Date
}
```

Then `& { fieldCount: number }` adds the computed `fieldCount` property.

### `FormDraft`

```typescript
type FormDraft = Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>
```

Step by step:
1. `Omit<Form, 'id' | 'createdAt' | 'updatedAt'>` → removes server-generated fields
2. `Partial<...>` → makes every remaining property optional

Result:
```typescript
{
  title?: string
  description?: string
  fields?: FormField[]
}
```

Use this for a form that is being built in the UI — the user might have a title but not have added fields yet.

### `CreateFormDTO`

```typescript
type CreateFormDTO = { title: string; description?: string; prompt: string }
```

**DTO = Data Transfer Object** — the shape of data crossing the API boundary (from the browser to the server). `prompt` is the user's natural-language description of the form.

### `FormResponseDTO`

```typescript
type FormResponseDTO = { data: FormPreview[]; total: number; page: number }
```

The paginated list response shape. `total` is the total number of forms in the DB; `page` is the current page number.

---

## API Types (`src/types/api.types.ts`)

### `ApiResponse<T>`

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code: number }
```

A discriminated union using `ok` as the tag. Every API route returns this shape.

```typescript
// Checking the response:
const res: ApiResponse<FormPreview[]> = await fetchForms()

if (res.ok) {
  // TypeScript knows: res.data is FormPreview[]
  res.data.map(f => f.title)
} else {
  // TypeScript knows: res.error is string, res.code is number
  console.error(res.error, res.code)
}
```

Notice that if `ok` is `true`, the `error` and `code` properties don't exist. If `ok` is `false`, `data` doesn't exist. TypeScript enforces this through the discriminated union — you can't accidentally access `res.data` on the error branch.

### `ApiError`

```typescript
type ApiError = { ok: false; error: string; code: number }
```

The error branch extracted as its own type. Useful when you want to type-check only the error case.

---

## Barrel Export (`src/types/index.ts`)

```typescript
export type { FormField, TextField, NumberField, SelectField, CheckboxField, DateField, FieldKind, FieldValue } from './field.types'
export type { Form, FormPreview, FormDraft, CreateFormDTO, FormResponseDTO } from './form.types'
export type { ApiResponse, ApiError } from './api.types'
```

A **barrel export** re-exports everything from sub-files through a single entry point. Instead of:
```typescript
import type { FormField } from '@/types/field.types'
import type { Form } from '@/types/form.types'
```

You write:
```typescript
import type { FormField, Form } from '@/types'
```

The `export type { ... }` syntax (not `export { ... }`) ensures these are type-only exports — they are erased completely from the compiled JavaScript.
