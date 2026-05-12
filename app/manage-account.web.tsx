import { useAuth } from "@clerk/expo"
import { UserProfile } from "@clerk/expo/web"
import { Redirect, Stack } from "expo-router"
import { View } from "react-native"

import { LoadingScreen } from "@/components/ui/page"

export default function ManageAccountScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading account…" />
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />
  }

  return (
    <>
      <Stack.Screen options={{ title: "Account" }} />
      <View className="min-h-0 flex-1 bg-background">
        <UserProfile />
      </View>
    </>
  )
}
