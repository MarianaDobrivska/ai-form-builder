import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createFormSchema } from '@/lib/validators/form.validators'
import { getAllForms } from '@/lib/db/forms.repository'
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
    void body
    return NextResponse.json({ ok: false, error: 'Not implemented', code: 501 }, { status: 501 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ ok: false, error: 'Invalid input', code: 400 }, { status: 400 })
    return NextResponse.json({ ok: false, error: 'Internal error', code: 500 }, { status: 500 })
  }
}
