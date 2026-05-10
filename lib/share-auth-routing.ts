import { useShareIntentContext } from "expo-share-intent"

/** Where to send the user after sign-in / sign-up when a share is waiting. */
export type PostAuthHref = "/share-inbox" | "/(tabs)/notes"

/**
 * Routes completed auth to the share inbox when inbound share data is present.
 * Uses `isReady` so we do not send users to notes before the native share module
 * has reported its initial state (avoids losing cold-start shares).
 */
export function usePostAuthHref(): PostAuthHref {
  const { hasShareIntent, isReady } = useShareIntentContext()
  return isReady && hasShareIntent ? "/share-inbox" : "/(tabs)/notes"
}
