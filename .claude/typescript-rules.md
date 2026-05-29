# TypeScript Rules — Non-Negotiable

## 1. Never use `any`
```typescript
// BAD
function parseAI(response: any) { ... }

// GOOD
function parseAI(response: unknown): FormField[] {
  if (!Array.isArray(response)) throw new Error('Expected array')
  return response.map(parseField)
}
```

## 2. FormField — discriminated union
```typescript
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

## 3. Exhaustive switch with `never`
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
    default:         return assertNever(field) // compile error if case missing
  }
}
```

## 4. Generic ApiResponse for all routes
```typescript
type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code: number }
```

## 5. Type guards — never cast with `as`
```typescript
// BAD
const field = data as TextField

// GOOD
function isTextField(field: FormField): field is TextField {
  return field.kind === 'text'
}
```

## 6. Utility types — use actively
```typescript
type FormPreview  = Pick<Form, 'id' | 'title' | 'createdAt' | 'fieldCount'>
type FormDraft    = Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>
type ReadonlyForm = Readonly<Form>
type FieldKind    = FormField['kind']                      // indexed access
type FieldMap     = Record<FieldKind, React.ComponentType<any>>
```

## 7. Conditional types for FieldValue
```typescript
type FieldValue<T extends FormField> =
  T extends TextField     ? string  :
  T extends NumberField   ? number  :
  T extends CheckboxField ? boolean :
  T extends SelectField   ? T['options'][number] :
  T extends DateField     ? string  :
  never
```

## 8. tsconfig — required flags
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": "."
  }
}
```

## Naming Conventions
- Types/interfaces: `PascalCase` — `FormField`, `ApiResponse<T>`
- Functions: `camelCase` — `isTextField`, `parseAIResponse`
- Files: `kebab-case` — `field.types.ts`, `form.validators.ts`
- React components: `PascalCase` files — `TextField.tsx`
- Zod schemas: `camelCase` + `Schema` suffix — `createFormSchema`
