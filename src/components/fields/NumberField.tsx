'use client'

import type { NumberField as NumberFieldType } from '@/types'

type Props = { field: NumberFieldType; value: number; onChange: (v: number) => void }

export function NumberField({ field, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {field.required ? `${field.label} *` : field.label}
      </label>
      <input
        id={field.id}
        type="number"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}
