type Params = { params: Promise<{ id: string }> }

export default async function FormPage({ params }: Params) {
  const { id } = await params

  return (
    <main>
      <h1>Form {id}</h1>
    </main>
  )
}
