function trimTrailing(value: string) {
  return value.replace(/\/$/, "")
}

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
}

function isLocalHttpUrl(value: string) {
  return value.startsWith("http://localhost") || value.startsWith("http://127.0.0.1")
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? ""
if (!rawApiUrl) {
  console.warn(
    "[bascybrosmobile] EXPO_PUBLIC_API_URL is not set — API calls will fail. Copy .env.example to .env and configure it."
  )
}

const fallbackApiUrl = "http://localhost:3000"
const configuredApiUrl = rawApiUrl ? trimTrailing(rawApiUrl) : fallbackApiUrl

if (__DEV__) {
  if (!isHttpUrl(configuredApiUrl)) {
    throw new Error("[bascybrosmobile] EXPO_PUBLIC_API_URL must start with http:// or https://")
  }
} else if (!configuredApiUrl.startsWith("https://")) {
  throw new Error("[bascybrosmobile] EXPO_PUBLIC_API_URL must use https:// in release builds")
}

if (!__DEV__ && isLocalHttpUrl(configuredApiUrl)) {
  throw new Error("[bascybrosmobile] Localhost API URL is not allowed in release builds")
}

export const API_URL = configuredApiUrl

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? ""

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "[bascybrosmobile] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — auth will fail."
  )
}
