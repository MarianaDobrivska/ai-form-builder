'use client'

import type { CheckboxField as CheckboxFieldType } from '@/types'

type Props = { field: CheckboxFieldType; value: boolean; onChange: (v: boolean) => void }

export function CheckboxField({ field, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={field.id}>
        <input
          id={field.id}
          type="checkbox"
          checked={value}
          required={field.required}
          readOnly={field.readonly}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.required ? `${field.label} *` : field.label}
      </label>
    </div>
  )
}
