import { ClerkProvider, useAuth } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { PortalHost } from "@rn-primitives/portal"
import { ThemeProvider } from "@react-navigation/native"
import { Stack, usePathname, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { LogBox, useColorScheme } from "react-native"
import "react-native-reanimated"
import "../global.css"
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent"

import { ReactQueryProvider } from "@/lib/query"
import { CLERK_PUBLISHABLE_KEY } from "@/lib/config"
import { NAV_THEME } from "@/lib/theme"

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

  useEffect(() => {
    if (process.env.EXPO_OS !== "web" || typeof document === "undefined") return
    document.documentElement.classList.toggle("dark", colorScheme === "dark")
  }, [colorScheme])

  return (
    // ShareIntentProvider wraps everything so all screens share one intent state.
    // Android: singleTask + with-android-share-task-root (see plugins/) relaunch
    // when the host embeds MainActivity in its task (Chrome/Google share), which
    // otherwise spawned a second React tree and duplicate ClerkProvider errors.
    <ShareIntentProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ReactQueryProvider>
          <ThemeProvider value={colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light}>
            <ShareIntentRedirector />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="sign-up" options={{ headerShown: false }} />
              <Stack.Screen name="verify-email" options={{ headerShown: false }} />
              <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ headerShown: false }} />
              <Stack.Screen name="oauth-callback" options={{ headerShown: false }} />
              <Stack.Screen name="share-inbox" options={{ headerShown: false }} />
              <Stack.Screen name="manage-account" options={{ title: "Account", presentation: "modal" }} />
              <Stack.Screen
                name="unauthorized"
                options={{ headerShown: false, presentation: "modal" }}
              />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <PortalHost />
          </ThemeProvider>
        </ReactQueryProvider>
      </ClerkProvider>
    </ShareIntentProvider>
  )
}

function ShareIntentRedirector() {
  const { hasShareIntent } = useShareIntentContext()
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasShareIntent) return
    if (pathname === "/share-inbox") return
    router.replace("/share-inbox" as never)
  }, [hasShareIntent, isLoaded, isSignedIn, pathname, router])

  return null
}
