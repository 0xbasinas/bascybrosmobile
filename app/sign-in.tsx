import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useAuth, useSignIn } from "@clerk/expo"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { Screen } from "@/components/ui/screen"
import { FontSize, Spacing, usePalette } from "@/lib/theme"

export function describeClerkError(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (!error) return fallback
  if (typeof error === "object" && error !== null) {
    const obj = error as {
      message?: unknown
      longMessage?: unknown
      errors?: { message?: unknown; longMessage?: unknown }[]
    }
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0]
      if (typeof first?.longMessage === "string") return first.longMessage
      if (typeof first?.message === "string") return first.message
    }
    if (typeof obj.longMessage === "string") return obj.longMessage
    if (typeof obj.message === "string") return obj.message
  }
  return fallback
}

export default function SignInScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { signIn } = useSignIn()
  const { isSignedIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  if (isSignedIn) {
    router.replace("/(tabs)/notes")
  }

  async function handleSubmit() {
    if (!signIn) return
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Enter your email and password.")
      return
    }
    setBusy(true)
    try {
      const created = await signIn.create({ identifier: email.trim() })
      if (created.error) {
        Alert.alert("Sign in failed", describeClerkError(created.error))
        return
      }
      const passwordResult = await signIn.password({ password })
      if (passwordResult.error) {
        Alert.alert("Sign in failed", describeClerkError(passwordResult.error))
        return
      }
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.replace("/(tabs)/notes")
            return Promise.resolve()
          },
        })
      } else {
        Alert.alert(
          "Sign in incomplete",
          "Additional steps are required (e.g. MFA). Please use the web app to finish setup."
        )
      }
    } catch (error) {
      Alert.alert("Sign in failed", describeClerkError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>BascyBros</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              Sign in to your cybersecurity workspace.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextInput
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <AppTextInput
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <AppButton
              title="Sign in"
              size="lg"
              fullWidth
              loading={busy}
              onPress={handleSubmit}
            />
          </View>

          <View style={styles.footer}>
            <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>
              Don&apos;t have an account?{" "}
            </Text>
            <Link
              href="/sign-up"
              style={{ color: palette.link, fontSize: FontSize.sm, fontWeight: "600" }}
            >
              Sign up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: "center",
  },
  form: {
    gap: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
})
