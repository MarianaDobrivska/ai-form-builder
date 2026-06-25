# Hooks

Custom hooks live in `src/hooks/`. They are marked `'use client'` because they use React's `useState`.

A custom hook is a function whose name starts with `use` and that can call other hooks. It encapsulates stateful logic so components stay declarative (they just render; they don't manage async logic).

---

## `useFormBuilder`

**File:** [src/hooks/useFormBuilder.ts](../src/hooks/useFormBuilder.ts)

Manages the state of the AI form generation flow.

```typescript
'use client'

import { useState } from 'react'
import type { FormField } from '@/types'

export function useFormBuilder() {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)

  async function generate(prompt: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json() as { ok: boolean; data?: FormField[] }
      if (json.ok && json.data) setFields(json.data)
    } finally {
      setLoading(false)
    }
  }

  return { fields, loading, generate }
}
```

### State

| Name | Type | Purpose |
|---|---|---|
| `fields` | `FormField[]` | The AI-generated fields, shown in the builder |
| `loading` | `boolean` | `true` while the API call is in flight — disables the button |

### `useState<FormField[]>([])`

`useState` is a generic function. `useState<FormField[]>([])` tells TypeScript the state variable is `FormField[]` and the initial value is `[]`. Without the type parameter, TypeScript would infer `never[]` from the empty array.

### The `generate` function

`generate` is an `async` function defined inside the hook. It:
1. Sets `loading: true`
2. Calls `POST /api/generate` with the prompt
3. If the response is OK, updates `fields`
4. Always sets `loading: false` in `finally` — even if an error is thrown

**`try/finally` without `catch`:** The `finally` block runs whether or not an error occurs. This ensures `loading` is always reset. We deliberately don't catch errors here — the component calling `generate` can wrap it in a try/catch if it needs to display an error message.

### The `as` cast

```typescript
const json = await res.json() as { ok: boolean; data?: FormField[] }
```

`res.json()` returns `Promise<any>` — the Fetch API has no type information. We cast to an approximate shape. This is one of the few acceptable uses of `as`: we're asserting a type at a trust boundary (HTTP response), and the type accurately reflects `ApiResponse<FormField[]>`.

A stricter approach: parse with Zod after fetching. For now, the cast is explicit and intentional.

### Return value

```typescript
return { fields, loading, generate }
```

Returns a plain object with the state and the action. The component destructures what it needs:

```typescript
const { fields, loading, generate } = useFormBuilder()
```

---

## `useFormSubmission`

**File:** [src/hooks/useFormSubmission.ts](../src/hooks/useFormSubmission.ts)

Manages submitting a completed form.

```typescript
'use client'

import { useState } from 'react'

export function useFormSubmission(formId: string) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit(data: Record<string, unknown>) {
    setSubmitting(true)
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ formId, data }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, submitted }
}
```

### Hook parameter

`useFormSubmission(formId: string)` takes a `formId` as a parameter. This is standard for hooks that need context from the component. The `formId` is captured in the closure of `submit`.

### State

| Name | Type | Purpose |
|---|---|---|
| `submitting` | `boolean` | `true` while the POST is in flight |
| `submitted` | `boolean` | `true` after a successful submission — used to show a success message |

### `data: Record<string, unknown>`

The form data is typed as `Record<string, unknown>` — field IDs mapped to their values. Using `unknown` forces the API route to validate the values before using them, rather than blindly trusting the client.

### Usage in a component

```typescript
function FormPage({ formId }: { formId: string }) {
  const { submit, submitting, submitted } = useFormSubmission(formId)
  const [values, setValues] = useState<Record<string, unknown>>({})

  if (submitted) return <p>Thank you for your response!</p>

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(values) }}>
      {/* field components */}
      <button disabled={submitting} type="submit">
        {submitting ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}
```

---

## Why Hooks, Not Component State

You could write all this logic directly in a component with `useState` and `fetch`. The hook extracts it so:

1. **Reusability:** Multiple components can use `useFormBuilder` without duplicating the fetch logic
2. **Testability:** You can test the hook in isolation, without rendering a component
3. **Readability:** The component only describes what to render; the hook describes how to fetch data

This aligns with the architecture rule: components are only for rendering. Logic lives in `lib/` (pure business logic) or hooks (stateful browser logic).
