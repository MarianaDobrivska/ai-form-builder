'use client'

import type { SelectField as SelectFieldType } from '@/types'

type Props = { field: SelectFieldType; value: string; onChange: (v: string) => void }

export function SelectField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>{field.required ? `${field.label} *` : field.label}</label>
      <select id={field.id} value={value} required={field.required} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
