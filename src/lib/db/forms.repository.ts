import { prisma } from './prisma'
import type { FormPreview } from '@/types'

// `fields` is persisted as a JSON string column; count its entries defensively.
function countFields(fieldsJson: string): number {
  try {
    const parsed: unknown = JSON.parse(fieldsJson)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export async function getAllForms(): Promise<FormPreview[]> {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return forms.map((f) => ({
    id: f.id,
    title: f.title,
    createdAt: f.createdAt,
    fieldCount: countFields(f.fields),
  }))
}
