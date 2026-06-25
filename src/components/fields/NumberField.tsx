'use client'

import type { NumberField as NumberFieldType } from '@/types'

type Props = { field: NumberFieldType; value: number; onChange: (v: number) => void }

export function NumberField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>{field.required ? `${field.label} *` : field.label}</label>
      <input
        id={field.id}
        type="number"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
