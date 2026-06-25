type Params = { params: Promise<{ id: string }> }

export default async function ResultsPage({ params }: Params) {
  const { id } = await params

  return (
    <main>
      <h1>Results for form {id}</h1>
    </main>
  )
}
