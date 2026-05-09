const rawRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim()

export const AUTH_REDIRECT_URL = rawRedirectUrl && rawRedirectUrl.length > 0
  ? rawRedirectUrl
  : "bascybrosmobile://oauth-callback"
