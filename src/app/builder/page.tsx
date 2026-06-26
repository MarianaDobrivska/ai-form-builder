'use client'

import { useState } from 'react'
import { useFormBuilder } from '@/hooks/useFormBuilder'
import { FormBuilder } from '@/components/builder/FormBuilder'
import { Button } from '@/components/ui/button'

export default function BuilderPage() {
  const [prompt, setPrompt] = useState('')
  const { state, generate } = useFormBuilder()
  const loading = state.status === 'loading'

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create a form</h1>
        <p className="text-muted-foreground">
          Describe the form you want in plain language and let AI build it.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A contact form with name, email, and a message"
          rows={4}
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          onClick={() => generate(prompt)}
          disabled={loading || prompt.trim() === ''}
          className="self-start"
        >
          {loading ? 'Generating…' : 'Generate form'}
        </Button>
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {state.status === 'success' && (
        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-lg font-medium">Preview</h2>
          <FormBuilder fields={state.fields} />
        </section>
      )}
    </main>
  )
}
