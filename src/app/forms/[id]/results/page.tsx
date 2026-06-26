import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFormById } from '@/lib/db/forms.repository'
import { getSubmissions } from '@/lib/db/submissions.repository'
import { buttonVariants } from '@/components/ui/button'

type Params = { params: Promise<{ id: string }> }

const getForm = cache(getFormById)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const form = await getForm(id)
  return { title: form ? `${form.title} · Responses` : 'Form not found' }
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export default async function ResultsPage({ params }: Params) {
  const { id } = await params
  const [form, submissions] = await Promise.all([getForm(id), getSubmissions(id)])
  if (!form) notFound()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
          <p className="text-muted-foreground">
            {submissions.length}{' '}
            {submissions.length === 1 ? 'response' : 'responses'}
          </p>
        </div>
        <Link
          href={`/forms/${form.id}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Open form
        </Link>
      </header>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No responses yet.</p>
          <p className="text-sm text-muted-foreground">
            Share the form link to start collecting answers.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                  Submitted
                </th>
                {form.fields.map((field) => (
                  <th
                    key={field.id}
                    className="whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {dateFormatter.format(submission.createdAt)}
                  </td>
                  {form.fields.map((field) => (
                    <td key={field.id} className="px-4 py-3">
                      {formatAnswer(submission.data[field.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
