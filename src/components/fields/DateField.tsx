'use client'

import type { DateField as DateFieldType } from '@/types'

type Props = { field: DateFieldType; value: string; onChange: (v: string) => void }

export function DateField({ field, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {field.required ? `${field.label} *` : field.label}
      </label>
      <input
        id={field.id}
        type="date"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        min={field.minDate}
        max={field.maxDate}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}
