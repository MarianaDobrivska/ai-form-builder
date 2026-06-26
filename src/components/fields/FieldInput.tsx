'use client'

import type { FormField } from '@/types'
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  DateField,
} from '@/components/fields'

export type FieldValue = string | number | boolean

type Props = {
  field: FormField
  value: FieldValue | undefined
  onChange: (value: FieldValue) => void
}

function assertNever(x: never): never {
  throw new Error(`Unhandled field kind: ${JSON.stringify(x)}`)
}

// Renders a single field's control, narrowing the loosely-typed stored value to
// the type each control expects. The exhaustive switch makes a missing kind a
// compile error.
export function FieldInput({ field, value, onChange }: Props) {
  switch (field.kind) {
    case 'text':
      return <TextField field={field} value={typeof value === 'string' ? value : ''} onChange={onChange} />
    case 'number':
      return <NumberField field={field} value={typeof value === 'number' ? value : 0} onChange={onChange} />
    case 'select':
      return <SelectField field={field} value={typeof value === 'string' ? value : ''} onChange={onChange} />
    case 'checkbox':
      return <CheckboxField field={field} value={typeof value === 'boolean' ? value : false} onChange={onChange} />
    case 'date':
      return <DateField field={field} value={typeof value === 'string' ? value : ''} onChange={onChange} />
    default:
      return assertNever(field)
  }
}
