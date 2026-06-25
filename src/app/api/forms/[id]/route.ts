import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, Form } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<Form>>> {
  const { id } = await params
  void id
  return NextResponse.json({ ok: false, error: 'Not implemented', code: 501 }, { status: 501 })
}

export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params
  void id
  return NextResponse.json({ ok: false, error: 'Not implemented', code: 501 }, { status: 501 })
}
