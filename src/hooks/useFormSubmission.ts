'use client'

import { useState } from 'react'
import { isRecord } from '@/lib/utils'

type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export function useFormSubmission(formId: string) {
  const [state, setState] = useState<SubmissionState>({ status: 'idle' })

  async function submit(data: Record<string, unknown>) {
    setState({ status: 'submitting' })
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, data }),
      })
      const json: unknown = await res.json()

      if (isRecord(json) && json.ok === true) {
        setState({ status: 'success' })
        return
      }

      const message =
        isRecord(json) && typeof json.error === 'string'
          ? json.error
          : 'Could not submit your response. Please try again.'
      setState({ status: 'error', message })
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Please try again.' })
    }
  }

  return { state, submit }
}
