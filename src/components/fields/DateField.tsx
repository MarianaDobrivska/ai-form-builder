'use client'

import type { DateField as DateFieldType } from '@/types'

type Props = { field: DateFieldType; value: string; onChange: (v: string) => void }

export function DateField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>{field.required ? `${field.label} *` : field.label}</label>
      <input
        id={field.id}
        type="date"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        min={field.minDate}
        max={field.maxDate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
