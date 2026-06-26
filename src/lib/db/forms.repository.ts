import { prisma } from './prisma'
import { isFormFieldArray } from '@/lib/validators/field.validators'
import type { CreateFormInput } from '@/lib/validators/form.validators'
import type { Form, FormField, FormPreview } from '@/types'

// `fields` is persisted as a JSON string column; count its entries defensively.
function countFields(fieldsJson: string): number {
  try {
    const parsed: unknown = JSON.parse(fieldsJson)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

// Parse the stored `fields` JSON back into validated FormField[], tolerating
// bad data (returns [] rather than throwing).
function parseFields(fieldsJson: string): FormField[] {
  try {
    const parsed: unknown = JSON.parse(fieldsJson)
    return isFormFieldArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function getAllForms(): Promise<FormPreview[]> {
  // Select only the columns the list needs — skip description/updatedAt.
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true, fields: true },
  })

  return forms.map((f) => ({
    id: f.id,
    title: f.title,
    createdAt: f.createdAt,
    fieldCount: countFields(f.fields),
  }))
}

export async function getFormById(id: string): Promise<Form | null> {
  const form = await prisma.form.findUnique({ where: { id } })
  if (!form) return null

  return {
    id: form.id,
    title: form.title,
    ...(form.description !== null ? { description: form.description } : {}),
    fields: parseFields(form.fields),
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  }
}

export async function createForm(input: CreateFormInput): Promise<FormPreview> {
  // `fields` is stored as a JSON string column.
  const form = await prisma.form.create({
    data: {
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      fields: JSON.stringify(input.fields),
    },
    select: { id: true, title: true, createdAt: true, fields: true },
  })

  return {
    id: form.id,
    title: form.title,
    createdAt: form.createdAt,
    fieldCount: countFields(form.fields),
  }
}
