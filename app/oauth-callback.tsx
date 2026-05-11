import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"

import { LoadingScreen } from "@/components/ui/page"

export default function OAuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Finishing sign in..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return <Redirect href="/sign-in" />
}
