export function describeClerkError(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (!error) return fallback
  if (typeof error === "object" && error !== null) {
    const obj = error as {
      message?: unknown
      longMessage?: unknown
      errors?: { message?: unknown; longMessage?: unknown }[]
    }
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0]
      if (typeof first?.longMessage === "string") return first.longMessage
      if (typeof first?.message === "string") return first.message
    }
    if (typeof obj.longMessage === "string") return obj.longMessage
    if (typeof obj.message === "string") return obj.message
  }
  return fallback
}
