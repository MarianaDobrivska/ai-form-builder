'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isRecord } from '@/lib/utils'
import type { FormField } from '@/types'

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string }

export function useSaveForm() {
  const router = useRouter()
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  async function save(title: string, fields: FormField[]) {
    setState({ status: 'saving' })
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, fields }),
      })
      const json: unknown = await res.json()

      if (isRecord(json) && json.ok === true) {
        // Navigate to the list and refresh its server data so the new form shows.
        router.push('/forms')
        router.refresh()
        return
      }

      const message =
        isRecord(json) && typeof json.error === 'string'
          ? json.error
          : 'Could not save the form. Please try again.'
      setState({ status: 'error', message })
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Please try again.' })
    }
  }

  return { state, save }
}
