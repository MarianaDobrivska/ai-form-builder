import Anthropic, { APIError } from '@anthropic-ai/sdk'
import { z } from 'zod'
import { formFieldSchema } from '@/lib/validators/field.validators'
import type { FormField } from '@/types'

const client = new Anthropic()

const aiResponseSchema = z.array(formFieldSchema)

const SYSTEM_PROMPT = `You generate form schemas. Respond with ONLY a raw JSON array of field objects — no markdown, no code fences, no explanation.
Each field has:
- "id": string, unique, kebab-case
- "label": string
- "required": boolean
- "kind": one of "text" | "number" | "select" | "checkbox" | "date"
For "select" fields also include "options": string[].`

// Thrown when form generation fails for a reason that is safe to show the user.
// `status` is the HTTP status the API route should respond with.
export class FormGenerationError extends Error {
  readonly status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = 'FormGenerationError'
    this.status = status
  }
}

// Treat the AI response as `unknown` and narrow it through a runtime check —
// never trust the model's JSON directly (see architecture.md).
function isFormFieldArray(value: unknown): value is FormField[] {
  return aiResponseSchema.safeParse(value).success
}

// Models often wrap JSON in a markdown code fence (```json ... ```); strip it
// before parsing so generation doesn't fail on otherwise-valid output.
function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fenced?.[1] ?? trimmed
}

// Map an Anthropic SDK error to a safe, user-facing FormGenerationError.
function describeApiError(error: APIError): FormGenerationError {
  if (error.status === 429)
    return new FormGenerationError('The AI service is busy right now. Please try again in a moment.', 503)
  if (error.status === 401 || error.status === 403)
    return new FormGenerationError('The AI service could not be authenticated. Please check the server configuration.', 502)
  return new FormGenerationError('The AI service is temporarily unavailable. Please try again.', 502)
}

async function requestFields(prompt: string): Promise<Anthropic.Message> {
  try {
    return await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate form fields for: ${prompt}` }],
    })
  } catch (error) {
    if (error instanceof APIError) throw describeApiError(error)
    throw new FormGenerationError('Could not reach the AI service. Please try again.', 502)
  }
}

export async function generateForm(prompt: string): Promise<FormField[]> {
  const message = await requestFields(prompt)

  const content = message.content[0]
  if (!content || content.type !== 'text')
    throw new FormGenerationError('The AI returned an unreadable response. Please try again.')

  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFence(content.text))
  } catch {
    throw new FormGenerationError('The AI did not return valid JSON. Please try again.')
  }

  if (!isFormFieldArray(parsed))
    throw new FormGenerationError('The AI returned fields in an unexpected format. Try rephrasing your prompt.')

  return parsed
}
