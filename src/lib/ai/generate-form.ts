import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { formFieldSchema } from '@/lib/validators/field.validators'
import type { FormField } from '@/types'

const client = new Anthropic()

const aiResponseSchema = z.array(formFieldSchema)

// Treat the AI response as `unknown` and narrow it through a runtime check —
// never trust the model's JSON directly (see architecture.md).
function isFormFieldArray(value: unknown): value is FormField[] {
  return aiResponseSchema.safeParse(value).success
}

export async function generateForm(prompt: string): Promise<FormField[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a JSON array of form fields for: ${prompt}. Each field must have id, label, required, and kind (text|number|select|checkbox|date).`,
      },
    ],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected AI response')

  const parsed: unknown = JSON.parse(content.text)
  if (!isFormFieldArray(parsed)) throw new Error('AI returned malformed form fields')

  return parsed
}
