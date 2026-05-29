# Architecture Rules

## Layers — strict, no exceptions
```
types/      → pure TypeScript types only. No logic, no imports from other layers.
lib/        → business logic. No React, no UI, no Next.js-specific imports.
components/ → React only. Imports from types/ and lib/.
app/api/    → HTTP layer only. Thin — delegates everything to lib/.
```

Import direction is always **downward**. Never import from `app/` into `lib/` or `types/`.

## Abstract class pattern for field renderers
```typescript
interface FieldRenderer<T extends FormField> {
  render(field: T, value: unknown): React.ReactNode
  validate(field: T, value: unknown): string | null
}

abstract class BaseFieldRenderer<T extends FormField> implements FieldRenderer<T> {
  abstract render(field: T, value: unknown): React.ReactNode

  validate(field: T, value: unknown): string | null {
    if (field.required && (value === undefined || value === null || value === ''))
      return `${field.label} is required`
    return null
  }

  protected formatLabel(field: T): string {
    return field.required ? `${field.label} *` : field.label
  }
}
```

## DTOs — separate from domain types
```typescript
// Domain model — internal use only
type Form = { id: string; title: string; fields: FormField[]; createdAt: Date }

// DTOs — cross API boundary
type CreateFormDTO   = { title: string; description?: string; prompt: string }
type FormResponseDTO = { data: FormPreview[]; total: number; page: number }
```

## Barrel exports — every folder with multiple files
```typescript
// types/index.ts
export type { FormField, TextField, SelectField, ... } from './field.types'
export type { Form, FormDraft, FormPreview }            from './form.types'
export type { ApiResponse, ApiError }                  from './api.types'
```

## AI generation flow
```
User prompt → POST /api/generate → Anthropic API → unknown → type guards → FormField[]
```
- Always treat AI response as `unknown` — never trust directly
- Wrap in try/catch — AI can return malformed JSON
- Model: `claude-haiku-4-5` (~$0.001 per call)

## API route template
```typescript
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<...>>> {
  try {
    const raw = await request.json()
    const body = bodySchema.parse(raw)        // zod validates unknown input
    const result = await someLibFunction(body) // delegate to lib/
    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```

## Interview highlights
When explaining the project, emphasize:
1. **Discriminated union** — `FormField` and why it's better than a class hierarchy
2. **Conditional types** — `FieldValue<T>` maps field type → value type at compile time
3. **`unknown` over `any`** — AI response parsing forces safe narrowing
4. **Exhaustive switch** — `assertNever` catches missing cases at compile time
5. **Separation of concerns** — types → lib → components → API, never circular
6. **Generic constraints** — `Form<T extends FormField>` vs plain `Form`
7. **Utility types in practice** — `Pick`, `Omit`, `Partial` in DTOs, not just theory
