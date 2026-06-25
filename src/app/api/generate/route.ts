import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateForm } from '@/lib/ai/generate-form'
import type { ApiResponse, FormField } from '@/types'

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
