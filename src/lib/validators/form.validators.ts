import { z } from 'zod'
import { formFieldSchema } from './field.validators'

export const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, 'A form needs at least one field'),
})

// The validated shape of a create-form request. Use this for code that
// consumes `createFormSchema.parse(...)` output.
export type CreateFormInput = z.infer<typeof createFormSchema>
