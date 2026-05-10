import { Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"
import { ActivityIndicator, View } from "react-native"
import { useShareIntentContext } from "expo-share-intent"

import { usePostAuthHref } from "@/lib/share-auth-routing"
import { usePalette } from "@/lib/theme"

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isReady: shareIntentReady } = useShareIntentContext()
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

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />
  }

  if (!shareIntentReady) {
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

  return <Redirect href={postAuthHref} />
}
