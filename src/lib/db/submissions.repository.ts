import { prisma } from './prisma'

type CreateSubmissionInput = { formId: string; data: Record<string, unknown> }

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
