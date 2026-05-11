import { Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"

import { LoadingScreen } from "@/components/ui/page"

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading workspace..." />
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />
  }

  return <Redirect href="/(tabs)/notes" />
}
