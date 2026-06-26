import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormById } from '@/lib/db/forms.repository'
import { FormFiller } from '@/components/form/FormFiller'
import { CopyLinkButton } from '@/components/form/CopyLinkButton'

type Params = { params: Promise<{ id: string }> }

// Shared across generateMetadata and the page so the form is fetched once.
const getForm = cache(getFormById)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const form = await getForm(id)
  return { title: form ? form.title : 'Form not found' }
}

export default async function FormPage({ params }: Params) {
  const { id } = await params
  const form = await getForm(id)
  if (!form) notFound()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>
        <CopyLinkButton />
      </header>

      <FormFiller formId={form.id} fields={form.fields} />
    </main>
  )
}
