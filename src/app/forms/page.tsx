import { Suspense } from 'react'
import Link from 'next/link'
import { getAllForms } from '@/lib/db/forms.repository'
import { buttonVariants } from '@/components/ui/button'

// The page component is synchronous, so the header renders instantly as part of
// the static shell while the form list streams in behind its Suspense boundary.
export default function FormsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">Forms you&apos;ve created.</p>
        </div>
        <Link href="/builder" className={buttonVariants()}>
          New form
        </Link>
      </header>

      <Suspense fallback={<FormListSkeleton />}>
        <FormList />
      </Suspense>
    </main>
  )
}

// Async Server Component: the only dynamic access on the page, so it alone
// suspends. Reads the database directly — no client JS, no API round-trip.
async function FormList() {
  const forms = await getAllForms()

  if (forms.length === 0) return <EmptyState />

  return (
    <ul className="flex flex-col gap-3">
      {forms.map((form) => (
        <li key={form.id}>
          <Link
            href={`/forms/${form.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <span className="truncate font-medium">{form.title}</span>
            <span className="shrink-0 text-sm text-muted-foreground">
              {form.fieldCount} {form.fieldCount === 1 ? 'field' : 'fields'} ·{' '}
              {formatDate(form.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
      <p className="text-muted-foreground">You haven&apos;t created any forms yet.</p>
      <Link href="/builder" className={buttonVariants({ variant: 'outline' })}>
        Create your first form
      </Link>
    </div>
  )
}

// Matches the row dimensions of FormList to reserve space and avoid layout
// shift (CLS) when the real content streams in.
function FormListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <li
          key={i}
          className="h-[58px] animate-pulse rounded-lg border bg-muted/40"
        />
      ))}
    </ul>
  )
}

// Module-level formatter is created once and reused. Safe in this Server
// Component (rendered only on the server, so no client hydration mismatch).
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(date: Date): string {
  return dateFormatter.format(date)
}
