'use client'

import { useState } from 'react'
import type { FormField } from '@/types'
import { FieldInput, type FieldValue } from '@/components/fields/FieldInput'

type Props = { fields: FormField[] }

// Interactive preview so the user can try the generated form out. The entered
// values are local-only — saving persists the form's structure, not these
// test answers.
export function FormBuilder({ fields }: Props) {
  const [values, setValues] = useState<Record<string, FieldValue>>({})

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
        />
      ))}
    </div>
  )
}
