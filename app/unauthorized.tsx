import { useRouter } from "expo-router"
import { useClerk } from "@clerk/expo"
import { StyleSheet, Text, View } from "react-native"

import { AppButton } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { FontSize, Spacing, usePalette } from "@/lib/theme"

export default function UnauthorizedScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { signOut } = useClerk()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.replace("/sign-in")
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: palette.text }]}>Access restricted</Text>
        <Text style={[styles.message, { color: palette.textMuted }]}>
          This account is signed in but its email isn&apos;t on the BascyBros allowlist. Ask
          an admin to add it, then sign in again.
        </Text>
        <AppButton title="Sign out" variant="outline" fullWidth onPress={handleSignOut} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: FontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },
})
