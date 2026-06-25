'use client'

import { useState } from 'react'
import type { FormField } from '@/types'

export function useFormBuilder() {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)

  async function generate(prompt: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ prompt }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json() as { ok: boolean; data?: FormField[] }
      if (json.ok && json.data) setFields(json.data)
    } finally {
      setLoading(false)
    }
  }

  return { fields, loading, generate }
}
