import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"

import { usePostAuthHref } from "@/lib/share-auth-routing"
import { usePalette } from "@/lib/theme"

export default function OAuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const postAuthHref = usePostAuthHref()
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
    return <Redirect href={postAuthHref} />
  }

  return <Redirect href="/sign-in" />
}
