import type { FormField } from './field.types'

export type Form = {
  id: string
  title: string
  description?: string
  fields: FormField[]
  createdAt: Date
  updatedAt: Date
}

export type FormPreview = Pick<Form, 'id' | 'title' | 'createdAt'> & { fieldCount: number }
export type FormDraft = Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>

export type CreateFormDTO = { title: string; description?: string; prompt: string }
export type FormResponseDTO = { data: FormPreview[]; total: number; page: number }
