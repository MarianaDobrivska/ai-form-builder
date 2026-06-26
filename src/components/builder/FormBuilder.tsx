'use client'

import { useState } from 'react'
import type { FormField } from '@/types'
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  DateField,
} from '@/components/fields'

type Props = { fields: FormField[] }

type FieldValue = string | number | boolean
type Values = Record<string, FieldValue>

function assertNever(x: never): never {
  throw new Error(`Unhandled field kind: ${JSON.stringify(x)}`)
}

export function FormBuilder({ fields }: Props) {
  const [values, setValues] = useState<Values>({})

  const set = (id: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [id]: value }))

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const current = values[field.id]

        switch (field.kind) {
          case 'text':
            return (
              <TextField
                key={field.id}
                field={field}
                value={typeof current === 'string' ? current : ''}
                onChange={(v) => set(field.id, v)}
              />
            )
          case 'number':
            return (
              <NumberField
                key={field.id}
                field={field}
                value={typeof current === 'number' ? current : 0}
                onChange={(v) => set(field.id, v)}
              />
            )
          case 'select':
            return (
              <SelectField
                key={field.id}
                field={field}
                value={typeof current === 'string' ? current : ''}
                onChange={(v) => set(field.id, v)}
              />
            )
          case 'checkbox':
            return (
              <CheckboxField
                key={field.id}
                field={field}
                value={typeof current === 'boolean' ? current : false}
                onChange={(v) => set(field.id, v)}
              />
            )
          case 'date':
            return (
              <DateField
                key={field.id}
                field={field}
                value={typeof current === 'string' ? current : ''}
                onChange={(v) => set(field.id, v)}
              />
            )
          default:
            return assertNever(field)
        }
      })}
    </div>
  )
}
