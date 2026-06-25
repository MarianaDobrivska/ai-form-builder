'use client'

import type { FormField } from '@/types'

type Props = { fields: FormField[] }

export function FormBuilder({ fields }: Props) {
  return (
    <div>
      {fields.map((field) => (
        <div key={field.id}>{field.label}</div>
      ))}
    </div>
  )
}
