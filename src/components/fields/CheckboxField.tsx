'use client'

import type { CheckboxField as CheckboxFieldType } from '@/types'

type Props = { field: CheckboxFieldType; value: boolean; onChange: (v: boolean) => void }

export function CheckboxField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id} className="flex items-center gap-2 text-sm font-medium">
        <input
          id={field.id}
          type="checkbox"
          checked={value}
          required={field.required}
          readOnly={field.readonly}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-input"
        />
        {field.required ? `${field.label} *` : field.label}
      </label>
    </div>
  )
}
