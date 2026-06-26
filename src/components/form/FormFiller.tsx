'use client'

import { useState } from 'react'
import type { FormField } from '@/types'
import { FieldInput, type FieldValue } from '@/components/fields/FieldInput'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import { Button } from '@/components/ui/button'

type Props = { formId: string; fields: FormField[] }
type Values = Record<string, FieldValue>

// A required field is "empty" if it has no value — and a required checkbox must
// be explicitly checked.
function isMissing(field: FormField, value: FieldValue | undefined): boolean {
  if (field.kind === 'checkbox') return value !== true
  return value === undefined || value === ''
}

export function FormFiller({ formId, fields }: Props) {
  const [values, setValues] = useState<Values>({})
  const [validationError, setValidationError] = useState<string | null>(null)
  const { state, submit } = useFormSubmission(formId)

  if (state.status === 'success') {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Thanks! Your response has been recorded.</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missing = fields.find((field) => field.required && isMissing(field, values[field.id]))
    if (missing) {
      setValidationError(`${missing.label} is required.`)
      return
    }
    setValidationError(null)
    void submit(values)
  }

  const submitting = state.status === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
        />
      ))}

      {validationError && <p className="text-sm text-destructive">{validationError}</p>}
      {state.status === 'error' && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? 'Submitting…' : 'Submit'}
      </Button>
    </form>
  )
}
