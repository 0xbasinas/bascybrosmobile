import { ClerkProvider } from "@clerk/expo"
import { useAuth } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack, usePathname, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { LogBox, useColorScheme } from "react-native"
import "react-native-reanimated"
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent"

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
    <ShareIntentProvider options={{ debug: __DEV__ }}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ReactQueryProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <ShareIntentRedirector />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="sign-up" options={{ headerShown: false }} />
              <Stack.Screen name="oauth-callback" options={{ headerShown: false }} />
              <Stack.Screen name="share-inbox" options={{ headerShown: false }} />
              <Stack.Screen
                name="unauthorized"
                options={{ headerShown: false, presentation: "modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ReactQueryProvider>
      </ClerkProvider>
    </ShareIntentProvider>
  )
}

function ShareIntentRedirector() {
  const { isLoaded, isSignedIn } = useAuth()
  const { hasShareIntent } = useShareIntentContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasShareIntent) return
    if (pathname === "/share-inbox") return
    router.replace("/share-inbox" as never)
  }, [hasShareIntent, isLoaded, isSignedIn, pathname, router])

  return null
}
