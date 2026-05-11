import { Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"
import { ActivityIndicator, ScrollView, View } from "react-native"

import { SignInForm } from "@/components/sign-in-form"
import { usePalette } from "@/lib/theme"

export default function SignInScreen() {
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

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 24,
        backgroundColor: palette.background,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <SignInForm />
    </ScrollView>
  )
}
