const rawRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim()
const DEFAULT_AUTH_REDIRECT_URL = "bascybrosmobile://oauth-callback"
const ALLOWED_AUTH_REDIRECT_URLS = new Set([
  DEFAULT_AUTH_REDIRECT_URL,
])

const configuredRedirectUrl = rawRedirectUrl && rawRedirectUrl.length > 0
  ? rawRedirectUrl
  : DEFAULT_AUTH_REDIRECT_URL

if (!ALLOWED_AUTH_REDIRECT_URLS.has(configuredRedirectUrl)) {
  throw new Error(
    `Invalid EXPO_PUBLIC_AUTH_REDIRECT_URL. Allowed values: ${Array.from(ALLOWED_AUTH_REDIRECT_URLS).join(", ")}`
  )
}

export const AUTH_REDIRECT_URL = configuredRedirectUrl
