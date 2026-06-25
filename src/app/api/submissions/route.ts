import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

const submissionSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const raw: unknown = await request.json()
    const body = submissionSchema.parse(raw)
    void body
    return NextResponse.json({ ok: false, error: 'Not implemented', code: 501 }, { status: 501 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
