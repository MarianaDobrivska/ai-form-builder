import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getFormById } from '@/lib/db/forms.repository'
import { createSubmission } from '@/lib/db/submissions.repository'
import { formatZodError } from '@/lib/validators/format-zod-error'
import type { ApiResponse } from '@/types'

const submissionSchema = z.object({
  formId: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const raw: unknown = await request.json()
    const body = submissionSchema.parse(raw)

    const form = await getFormById(body.formId)
    if (!form)
      return NextResponse.json({ ok: false, error: 'Form not found', code: 404 }, { status: 404 })

    await createSubmission(body)
    return NextResponse.json({ ok: true, data: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: formatZodError(error), code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
