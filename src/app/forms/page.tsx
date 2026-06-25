import type { FormPreview } from '@/types'

async function getForms(): Promise<FormPreview[]> {
  return []
}

export default async function FormsPage() {
  const forms = await getForms()

  return (
    <main>
      <h1>Forms</h1>
      <ul>
        {forms.map((f) => (
          <li key={f.id}>
            <a href={`/forms/${f.id}`}>{f.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
