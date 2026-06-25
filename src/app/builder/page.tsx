'use client'

import { useFormBuilder } from '@/hooks/useFormBuilder'

export default function BuilderPage() {
  const { generate, loading } = useFormBuilder()

  return (
    <main>
      <h1>Form Builder</h1>
      <button disabled={loading} onClick={() => generate('contact form')}>
        {loading ? 'Generating…' : 'Generate'}
      </button>
    </main>
  )
}
