# Components

Components live in `src/components/`. They are React-only — no database calls, no direct Anthropic SDK usage.

```
components/
├── fields/       ← one controlled component per field kind
│   ├── TextField.tsx
│   ├── NumberField.tsx
│   ├── SelectField.tsx
│   ├── CheckboxField.tsx
│   ├── DateField.tsx
│   └── index.ts  ← barrel export
├── builder/
│   ├── FormBuilder.tsx
│   └── FieldPreview.tsx
└── ui/           ← shadcn/ui auto-generated components
    └── button.tsx
```

---

## `'use client'` Directive

Every component file starts with `'use client'`. This is a Next.js 16 directive that tells the framework this component runs in the browser (not on the server).

**Why it's needed here:** These components use browser-only features:
- Event handlers (`onChange`, `onClick`)
- React state (via `useState` in hooks)

**Server components** (without `'use client'`) run only on the server and cannot use state or event handlers. They are used for data fetching pages.

---

## Field Components

Each field component is a **controlled component** — it receives its current value as a prop and calls a callback to report changes. It does not own any internal state.

### Controlled vs Uncontrolled

```typescript
// Controlled (what we use):
<TextField field={field} value={value} onChange={(v) => setValue(v)} />
// The parent owns the state. The component just renders and calls back.

// Uncontrolled (not used):
<input defaultValue="..." />
// The DOM owns the state. You read it with a ref.
```

Controlled components are easier to reason about: the source of truth is always in the parent (the form state, stored in the hook).

---

### `TextField`

**File:** [src/components/fields/TextField.tsx](../src/components/fields/TextField.tsx)

```typescript
'use client'

import type { TextField as TextFieldType } from '@/types'

type Props = { field: TextFieldType; value: string; onChange: (v: string) => void }

export function TextField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>{field.required ? `${field.label} *` : field.label}</label>
      <input
        id={field.id}
        type="text"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        minLength={field.minLength}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
```

**TypeScript note — name collision:** The type `TextField` from `@/types` and the component function `TextField` would have the same name. We alias the import: `import type { TextField as TextFieldType }`. This is a common pattern when a component name matches a type name.

**Props type:**
```typescript
type Props = { field: TextFieldType; value: string; onChange: (v: string) => void }
```

`onChange: (v: string) => void` — a function type. The function takes one argument of type `string` and returns `void` (the return value is ignored). This is the standard React change handler pattern.

**Label asterisk:** `field.required ? \`${field.label} *\` : field.label` — a ternary that adds " *" to the label for required fields. Template literals (backtick strings) allow embedding expressions with `${}`.

**`htmlFor` / `id` connection:** Setting `htmlFor={field.id}` on the label and `id={field.id}` on the input links them — clicking the label focuses the input. Required for accessibility.

---

### `NumberField`

```typescript
type Props = { field: NumberFieldType; value: number; onChange: (v: number) => void }
```

Note that `value` is `number`, not `string`. The `onChange` converts: `onChange={(e) => onChange(Number(e.target.value))}`. The DOM always gives string values from inputs; `Number()` converts it.

---

### `SelectField`

```typescript
type Props = { field: SelectFieldType; value: string; onChange: (v: string) => void }

// Renders:
{field.options.map((opt) => (
  <option key={opt} value={opt}>{opt}</option>
))}
```

`field.options` is `readonly string[]`. The `map` over a `readonly` array works the same as a regular array — `readonly` only prevents mutations.

**The `key` prop:** React requires a stable `key` on elements rendered in a list. Here `opt` (the option string itself) works as a key because option values are unique within a select.

---

### `CheckboxField`

```typescript
type Props = { field: CheckboxFieldType; value: boolean; onChange: (v: boolean) => void }

onChange={(e) => onChange(e.target.checked)}
```

`e.target.checked` is a `boolean` (unlike `e.target.value` which is always a string). TypeScript knows this because React types `onChange` on `<input type="checkbox">` to give `React.ChangeEvent<HTMLInputElement>`, and `HTMLInputElement.checked` is typed as `boolean`.

---

### `DateField`

```typescript
type Props = { field: DateFieldType; value: string; onChange: (v: string) => void }
```

Date values are stored as ISO date strings (`"2024-12-25"`), not `Date` objects. This is intentional: `Date` objects are hard to serialize, and HTML `<input type="date">` naturally works with string values.

---

### Barrel Export (`src/components/fields/index.ts`)

```typescript
export { TextField } from './TextField'
export { NumberField } from './NumberField'
export { SelectField } from './SelectField'
export { CheckboxField } from './CheckboxField'
export { DateField } from './DateField'
```

Allows importing any field component from `@/components/fields`:
```typescript
import { TextField, SelectField } from '@/components/fields'
```

---

## Builder Components

### `FormBuilder`

**File:** [src/components/builder/FormBuilder.tsx](../src/components/builder/FormBuilder.tsx)

```typescript
type Props = { fields: FormField[] }

export function FormBuilder({ fields }: Props) {
  return (
    <div>
      {fields.map((field) => (
        <div key={field.id}>{field.label}</div>
      ))}
    </div>
  )
}
```

Currently a stub. Will become the full builder interface: drag-to-reorder fields, edit field properties, preview the final form. `fields` comes from the `useFormBuilder` hook which calls the AI.

### `FieldPreview`

**File:** [src/components/builder/FieldPreview.tsx](../src/components/builder/FieldPreview.tsx)

```typescript
type Props = { field: FormField }

export function FieldPreview({ field }: Props) {
  return <div>{field.label}</div>
}
```

Will render a card showing the field kind icon, label, and configuration. Accepts `FormField` (the union type) — it will use a switch on `field.kind` to render different previews for different field types.

---

## shadcn/ui

**File:** [src/components/ui/button.tsx](../src/components/ui/button.tsx)

shadcn/ui is a component library with a twist: instead of installing a package, you copy the component source code into your project. This gives you full control over styles and behavior.

The `Button` component was added automatically when we ran `npx shadcn@latest init`.

### Adding more shadcn/ui components

```bash
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add label
```

Components land in `src/components/ui/`. You can edit them freely.

---

## `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

The `cn()` utility is generated by shadcn/ui. It merges Tailwind classes intelligently:

```typescript
cn('px-2 py-1', condition && 'bg-red-500', 'px-4')
// → 'py-1 bg-red-500 px-4'  (later px wins; falsy values dropped)
```

`clsx` handles conditional classes (drops `false`/`undefined`). `twMerge` resolves Tailwind conflicts (last `px` wins instead of both being present).

**TypeScript note:** `...inputs: ClassValue[]` uses a **rest parameter** — the function accepts any number of arguments, collected into an array. `ClassValue` is a type from `clsx` that allows strings, arrays, and objects.
