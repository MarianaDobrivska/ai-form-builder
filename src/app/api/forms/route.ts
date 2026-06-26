import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createFormSchema } from '@/lib/validators/form.validators'
import { formatZodError } from '@/lib/validators/format-zod-error'
import { createForm, getAllForms } from '@/lib/db/forms.repository'
import type { ApiResponse, FormPreview } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<FormPreview[]>>> {
  try {
    const forms = await getAllForms()
    return NextResponse.json({ ok: true, data: forms })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FormPreview>>> {
  try {
    const raw: unknown = await request.json()
    const body = createFormSchema.parse(raw)
    const form = await createForm(body)
    return NextResponse.json({ ok: true, data: form }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: formatZodError(error), code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
