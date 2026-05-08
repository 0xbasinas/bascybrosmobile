import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"

import { usePalette } from "@/lib/theme"

export default function OAuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const palette = usePalette()

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator color={palette.text} />
      </View>
    )
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return <Redirect href="/sign-in" />
}
