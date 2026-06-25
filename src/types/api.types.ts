export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: number }

export type ApiError = { ok: false; error: string; code: number }
