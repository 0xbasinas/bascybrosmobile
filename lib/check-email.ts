import { API_URL } from "./config"

export type CheckEmailResult = {
  allowed: boolean
  reason?: string
  isAdmin?: boolean
}

export async function checkEmailAllowed(email: string): Promise<CheckEmailResult> {
  const trimmed = email.trim()
  if (!trimmed) {
    return { allowed: false, reason: "Email is required." }
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: trimmed }),
    })
  } catch (error) {
    return {
      allowed: false,
      reason:
        error instanceof Error ? error.message : "Couldn't reach the server.",
    }
  }

  let data: CheckEmailResult | null = null
  try {
    data = (await response.json()) as CheckEmailResult
  } catch {
    /* no body */
  }

  if (!response.ok) {
    return {
      allowed: false,
      reason:
        data?.reason ?? `Allowlist check failed (${response.status}).`,
    }
  }

  return data ?? { allowed: false, reason: "Empty response." }
}
