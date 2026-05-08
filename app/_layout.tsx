import { ClerkProvider } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { LogBox, useColorScheme } from "react-native"
import "react-native-reanimated"

import { ReactQueryProvider } from "@/lib/query"
import { CLERK_PUBLISHABLE_KEY } from "@/lib/config"

export const unstable_settings = {
  anchor: "(tabs)",
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreLogs([
        "new NativeEventEmitter() was called with a non-null argument",
      ])
    }
  }, [])

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ReactQueryProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="oauth-callback" options={{ headerShown: false }} />
            <Stack.Screen
              name="unauthorized"
              options={{ headerShown: false, presentation: "modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ReactQueryProvider>
    </ClerkProvider>
  )
}
