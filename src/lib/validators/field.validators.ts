import { z } from 'zod'

const baseFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  readonly: z.boolean().optional(),
})

export const textFieldSchema = baseFieldSchema.extend({ kind: z.literal('text'), minLength: z.number().optional(), maxLength: z.number().optional() })
export const numberFieldSchema = baseFieldSchema.extend({ kind: z.literal('number'), min: z.number().optional(), max: z.number().optional() })
export const selectFieldSchema = baseFieldSchema.extend({ kind: z.literal('select'), options: z.array(z.string()) })
export const checkboxFieldSchema = baseFieldSchema.extend({ kind: z.literal('checkbox'), defaultChecked: z.boolean().optional() })
export const dateFieldSchema = baseFieldSchema.extend({ kind: z.literal('date'), minDate: z.string().optional(), maxDate: z.string().optional() })

export const formFieldSchema = z.discriminatedUnion('kind', [
  textFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  checkboxFieldSchema,
  dateFieldSchema,
])
