# AI Integration

The AI layer lives in `src/lib/ai/generate-form.ts`. It is plain business logic — no React, no HTTP handling. The API route in `src/app/api/generate/route.ts` is the thin adapter that connects it to HTTP.

---

## How It Works

```
POST /api/generate
{ prompt: "I need a job application form" }
        │
        ▼
generateForm(prompt)            ← src/lib/ai/generate-form.ts
        │
        ▼
Anthropic Claude API
claude-haiku-4-5
        │
        ▼
AI returns text (a JSON string)
        │
        ▼
JSON.parse → unknown
        │
        ▼
type guard (Array.isArray)
        │
        ▼
FormField[]
```

---

## Implementation (`src/lib/ai/generate-form.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { FormField } from '@/types'

const client = new Anthropic()

export async function generateForm(prompt: string): Promise<FormField[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a JSON array of form fields for: ${prompt}. Each field must have id, label, required, and kind (text|number|select|checkbox|date).`,
      },
    ],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected AI response')

  const parsed: unknown = JSON.parse(content.text)
  if (!Array.isArray(parsed)) throw new Error('Expected array from AI')

  return parsed as FormField[]
}
```

---

## Key Decisions

### `claude-haiku-4-5` model

Claude Haiku is the fastest and cheapest Claude model. For form generation:
- Input: a short user prompt (~20 words)
- Output: a JSON array (~10–20 fields, ~500–1000 tokens)

Cost is approximately $0.001 per call — negligible. Haiku's quality is sufficient for structured generation tasks with a clear schema.

### `max_tokens: 1024`

Sets an upper bound on the response length. 1024 tokens is approximately 750 words — more than enough for a field list while preventing runaway responses.

### The Anthropic client

```typescript
const client = new Anthropic()
```

`new Anthropic()` reads `ANTHROPIC_API_KEY` from the environment automatically. No need to pass it explicitly. The key must be set in `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Accessing the response content

```typescript
const content = message.content[0]
if (!content || content.type !== 'text') throw new Error('Unexpected AI response')
```

`message.content` is an array of content blocks. For a standard text response there is one block. The `noUncheckedIndexedAccess` tsconfig flag means `content[0]` has type `ContentBlock | undefined`, so the `!content` check is required.

`content.type !== 'text'` guards against tool-use blocks (not used here but theoretically possible).

### Treating AI output as `unknown`

```typescript
const parsed: unknown = JSON.parse(content.text)
if (!Array.isArray(parsed)) throw new Error('Expected array from AI')
return parsed as FormField[]
```

`JSON.parse()` returns `any`. We immediately assign to `unknown` to force explicit narrowing. After `Array.isArray(parsed)`, TypeScript knows it's an array. We then cast `as FormField[]` — this is the one place in the codebase where a cast is justified because:

1. We've already checked the outer structure (it's an array)
2. The schema validation (Zod on each element) is the next evolution
3. The type cast documents our intent explicitly

**The next step** (not yet implemented): run `z.array(formFieldSchema).parse(parsed)` instead of the cast. This would:
- Validate every field's structure at runtime
- Throw a descriptive error if the AI returned a malformed field
- Guarantee `FormField[]` is truly correct at runtime, not just trusted

---

## Adding Prompt Caching

The current implementation makes a fresh API call each time. For a production app, you'd add prompt caching to save money on repeated similar prompts:

```typescript
const message = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: 'You are a form builder assistant. Generate JSON arrays of form fields.',
      cache_control: { type: 'ephemeral' },  // ← cache the system prompt
    }
  ],
  messages: [{ role: 'user', content: prompt }],
})
```

The system prompt is stable (same every call) — caching it saves re-processing it on every request.

---

## Error Handling

`generateForm` can throw in two ways:
1. `JSON.parse` fails — the AI returned invalid JSON
2. `Array.isArray` check fails — the AI returned JSON but not an array

Both are propagated up to the API route's `catch` block, which maps them to a 500 response. A production version would add more specific error messages and potentially retry on transient failures.

---

## Environment Setup

To use the AI features, add your API key to `.env.local` (not committed to git):

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

`.env.local` is loaded automatically by Next.js. The Anthropic SDK reads `ANTHROPIC_API_KEY` from `process.env` automatically.
