'use client'

import type { TextField as TextFieldType } from '@/types'

type Props = { field: TextFieldType; value: string; onChange: (v: string) => void }

export function TextField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>{field.required ? `${field.label} *` : field.label}</label>
      <input
        id={field.id}
        type="text"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        minLength={field.minLength}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
