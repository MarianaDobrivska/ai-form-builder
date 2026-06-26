import { prisma } from './prisma'
import { isRecord } from '@/lib/utils'
import type { Submission } from '@/types'

type CreateSubmissionInput = { formId: string; data: Record<string, unknown> }

// `data` is stored as a JSON string column; parse it back defensively.
function parseData(json: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(json)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export async function getSubmissions(formId: string): Promise<Submission[]> {
  const submissions = await prisma.submission.findMany({
    where: { formId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, data: true, createdAt: true },
  })

  return submissions.map((s) => ({
    id: s.id,
    data: parseData(s.data),
    createdAt: s.createdAt,
  }))
}

export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<{ id: string }> {
  // `data` is stored as a JSON string column.
  const submission = await prisma.submission.create({
    data: { formId: input.formId, data: JSON.stringify(input.data) },
    select: { id: true },
  })

  return { id: submission.id }
}
