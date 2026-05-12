import { useAuth } from "@clerk/expo"
import { UserProfileView } from "@clerk/expo/native"
import { Redirect, Stack } from "expo-router"
import { View } from "react-native"

import { LoadingScreen } from "@/components/ui/page"

/**
 * Fallback account screen for native when the Clerk native module cannot present
 * the profile modal (for example Expo Go). Development builds can use the modal
 * from the user menu instead.
 */
export default function ManageAccountScreen() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })

  if (!isLoaded) {
    return <LoadingScreen label="Loading account…" />
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />
  }

  return (
    <>
      <Stack.Screen options={{ title: "Account" }} />
      <View className="flex-1 bg-background">
        <UserProfileView style={{ flex: 1 }} isDismissable={false} />
      </View>
    </>
  )
}
