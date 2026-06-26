'use client'

import { useState } from 'react'
import { isFormFieldArray } from '@/lib/validators/field.validators'
import { isRecord } from '@/lib/utils'
import type { GenerationState } from '@/types'

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

      if (isRecord(json) && json.ok === true && isFormFieldArray(json.data)) {
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
