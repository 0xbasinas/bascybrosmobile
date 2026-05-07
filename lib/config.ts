function trimTrailing(value: string) {
  return value.replace(/\/$/, "")
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? ""
if (!rawApiUrl) {
  console.warn(
    "[bascybrosmobile] EXPO_PUBLIC_API_URL is not set — API calls will fail. Copy .env.example to .env and configure it."
  )
}

export const API_URL = rawApiUrl ? trimTrailing(rawApiUrl) : "http://localhost:3000"

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? ""

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "[bascybrosmobile] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — auth will fail."
  )
}
