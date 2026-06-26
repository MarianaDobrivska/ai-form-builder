'use client'

import type { SelectField as SelectFieldType } from '@/types'

type Props = { field: SelectFieldType; value: string; onChange: (v: string) => void }

export function SelectField({ field, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {field.required ? `${field.label} *` : field.label}
      </label>
      <select
        id={field.id}
        value={value}
        required={field.required}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Select…</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
