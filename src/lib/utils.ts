import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Narrow an unknown value (e.g. a parsed JSON response) to an object before
// reading properties off it.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
