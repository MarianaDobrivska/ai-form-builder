'use client'

import type { TextField as TextFieldType } from '@/types'

type Props = { field: TextFieldType; value: string; onChange: (v: string) => void }

export function TextField({ field, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {field.required ? `${field.label} *` : field.label}
      </label>
      <input
        id={field.id}
        type="text"
        value={value}
        required={field.required}
        readOnly={field.readonly}
        minLength={field.minLength}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}
