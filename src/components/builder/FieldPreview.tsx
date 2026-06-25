'use client'

import type { FormField } from '@/types'

type Props = { field: FormField }

export function FieldPreview({ field }: Props) {
  return <div>{field.label}</div>
}
