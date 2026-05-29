# Create API Route

Create a new API route for `$ARGUMENTS`.

Rules:
- Return type must be `ApiResponse<T>` — never return raw data
- Validate input with Zod — parse `request.json()` as `unknown` first
- Wrap in try/catch — return `{ ok: false, error, code }` on failure
- Keep the route file thin (< 30 lines of logic) — delegate to `lib/`

Template:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

const bodySchema = z.object({ ... })

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<...>>> {
  try {
    const raw = await request.json()
    const body = bodySchema.parse(raw)
    const result = await someLibFunction(body)
    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
```
