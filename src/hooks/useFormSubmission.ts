'use client'

import { useState } from 'react'

export function useFormSubmission(formId: string) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit(data: Record<string, unknown>) {
    setSubmitting(true)
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ formId, data }),
        headers: { 'Content-Type': 'application/json' },
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, submitted }
}
