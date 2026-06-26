import { z } from 'zod'

// Turn a ZodError into a concise, user-facing string, prefixing each issue
// with its field path — e.g. "prompt: Too small: expected string to have >=1
// characters; email: Invalid email".
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}
