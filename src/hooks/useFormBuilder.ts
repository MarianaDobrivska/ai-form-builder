'use client'

import { useState } from 'react'
import { z } from 'zod'
import { formFieldSchema } from '@/lib/validators/field.validators'
import type { FormField, GenerationState } from '@/types'

const fieldsSchema = z.array(formFieldSchema)

// Narrow an unknown payload to FormField[] via runtime validation — the network
// response is untrusted, and a type guard keeps us `as`-free.
function isFieldArray(value: unknown): value is FormField[] {
  return fieldsSchema.safeParse(value).success
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function useFormBuilder() {
  const [state, setState] = useState<GenerationState>({ status: 'idle' })

  async function generate(prompt: string) {
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const json: unknown = await res.json()

      if (isRecord(json) && json.ok === true && isFieldArray(json.data)) {
        setState({ status: 'success', fields: json.data })
      } else if (isRecord(json) && typeof json.error === 'string') {
        setState({ status: 'error', message: json.error })
      } else {
        setState({ status: 'error', message: 'Unexpected response from the server.' })
      }
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Please try again.' })
    }
  }

  return { state, generate }
}
