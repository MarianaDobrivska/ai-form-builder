# API Routes

All routes live under `src/app/api/`. They are Next.js 16 **Route Handlers** — TypeScript files that export named async functions matching HTTP methods (`GET`, `POST`, `DELETE`, etc.).

Every route follows the same template:
1. Parse and validate the request body with Zod
2. Delegate to a `lib/` function
3. Return `NextResponse.json({ ok: true, data })` or an error shape

---

## Response Envelope

Every route returns `ApiResponse<T>`:

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string; code: number }
```

The `code` field mirrors the HTTP status — included in the body so clients don't need to inspect headers separately.

---

## `GET /api/forms`

**File:** [src/app/api/forms/route.ts](../src/app/api/forms/route.ts)

Returns the list of all forms.

**Response:** `ApiResponse<FormPreview[]>`

```typescript
export async function GET(): Promise<NextResponse<ApiResponse<FormPreview[]>>> {
  try {
    return NextResponse.json({ ok: true, data: [] })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```

**Status:** Stub — returns an empty array. Will call `getAllForms()` from the repository.

**TypeScript note:** `GET()` has no parameters because it doesn't need to read the request (no body, no dynamic segment). The return type `Promise<NextResponse<ApiResponse<FormPreview[]>>>` is fully explicit — TypeScript will error if the function body returns a different shape.

---

## `POST /api/forms`

**File:** [src/app/api/forms/route.ts](../src/app/api/forms/route.ts)

Creates a new form.

**Request body:**
```json
{ "title": "Job Application", "description": "Optional", "prompt": "I need a job application form" }
```

**Response:** `ApiResponse<FormPreview>`

```typescript
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FormPreview>>> {
  try {
    const raw: unknown = await request.json()
    const body = createFormSchema.parse(raw)
    // ... save to DB
    return NextResponse.json({ ok: true, data: form })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```

**Validation pattern:** `request.json()` returns `any` in Next.js, but we immediately assign it to `unknown` (`const raw: unknown`), then parse with Zod. Zod throws a `ZodError` if the body doesn't match `createFormSchema`.

**Status:** Stub — Zod validation works, but the DB save is not yet implemented.

---

## `GET /api/forms/[id]`

**File:** [src/app/api/forms/[id]/route.ts](../src/app/api/forms/%5Bid%5D/route.ts)

Returns a single form by ID.

**Response:** `ApiResponse<Form>`

```typescript
type Params = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse<ApiResponse<Form>>> {
  const { id } = await params
  // ... fetch from DB
}
```

**Next.js 16 note:** Route segment parameters (`params`) are now a `Promise` in Next.js 16 — you must `await params` before destructuring. In older Next.js versions, `params` was a plain object. This is a breaking change.

**The `_request` prefix:** The underscore convention signals "this parameter is required by the Next.js signature but not used in this function". Without it, TypeScript would warn about unused parameters (or ESLint would).

**Status:** Stub — returns 501.

---

## `DELETE /api/forms/[id]`

**File:** [src/app/api/forms/[id]/route.ts](../src/app/api/forms/%5Bid%5D/route.ts)

Deletes a form and all its submissions (cascade).

**Response:** `ApiResponse<null>`

`null` as the data type signals "success, but no meaningful data to return". The client just needs to know it succeeded.

**Status:** Stub — returns 501.

---

## `POST /api/generate`

**File:** [src/app/api/generate/route.ts](../src/app/api/generate/route.ts)

Calls the Claude API to generate form fields from a natural-language prompt.

**Request body:**
```json
{ "prompt": "I need a job application form with name, email, resume upload, and cover letter" }
```

**Response:** `ApiResponse<FormField[]>`

```typescript
const generateSchema = z.object({ prompt: z.string().min(1) })

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FormField[]>>> {
  try {
    const raw: unknown = await request.json()
    const { prompt } = generateSchema.parse(raw)
    const fields = await generateForm(prompt)
    return NextResponse.json({ ok: true, data: fields })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```

This route is **fully implemented** — it wires Zod validation to the AI generation function.

**Validation:** `z.string().min(1)` rejects an empty prompt.

---

## `POST /api/submissions`

**File:** [src/app/api/submissions/route.ts](../src/app/api/submissions/route.ts)

Saves a form submission.

**Request body:**
```json
{
  "formId": "clu4z9x0k0000vlk4",
  "data": {
    "field-1": "John Doe",
    "field-2": 25,
    "field-3": true
  }
}
```

**Response:** `ApiResponse<null>`

```typescript
const submissionSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.unknown()),
})
```

`z.record(z.string(), z.unknown())` validates that `data` is an object with string keys and any values. The actual field-level validation (e.g. "this field is required") happens on the client before submission, but a full implementation would also validate field values against the form schema server-side.

**Status:** Stub — returns 501.

---

## Error Handling Pattern

Every route wraps its logic in a `try/catch` and distinguishes two error types:

```typescript
try {
  // ... happy path
} catch (error) {
  if (error instanceof z.ZodError)
    // Zod validation failed — client sent bad data
    return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })

  // Everything else — unexpected server error
  return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
}
```

`error instanceof z.ZodError` is TypeScript **narrowing** in a catch block. Before the check, `error` has type `unknown`. After the `instanceof` check, TypeScript knows it's a `ZodError` and you can access `.issues`, `.message`, etc.

---

## Next.js 16 Route Handler Conventions

| Convention | Example |
|---|---|
| File name | `route.ts` (not `handler.ts`) |
| HTTP method | export `async function GET/POST/DELETE/...` |
| Dynamic segment | folder named `[id]` → `params.id` |
| Return type | `NextResponse<T>` with the JSON response type |
| Async params | `params` is `Promise<{id: string}>` — must be awaited |
