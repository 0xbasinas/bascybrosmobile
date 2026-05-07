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
import { useSignUp } from "@clerk/expo"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { Screen } from "@/components/ui/screen"
import { FontSize, Spacing, usePalette } from "@/lib/theme"

import { describeClerkError } from "./sign-in"

export default function SignUpScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { signUp } = useSignUp()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleStart() {
    if (!signUp) return
    if (!email.trim() || password.length < 8) {
      Alert.alert(
        "Missing fields",
        "Enter your email and a password with at least 8 characters."
      )
      return
    }
    setBusy(true)
    try {
      const created = await signUp.password({
        emailAddress: email.trim(),
        password,
      })
      if (created.error) {
        Alert.alert("Sign up failed", describeClerkError(created.error))
        return
      }
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) {
        Alert.alert(
          "Couldn't send code",
          describeClerkError(sent.error, "Try again in a moment.")
        )
        return
      }
      setPendingVerification(true)
    } catch (error) {
      Alert.alert("Sign up failed", describeClerkError(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    if (!signUp) return
    if (!code.trim()) {
      Alert.alert("Code required", "Enter the 6-digit code from your email.")
      return
    }
    setBusy(true)
    try {
      const verified = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      })
      if (verified.error) {
        Alert.alert("Invalid code", describeClerkError(verified.error))
        return
      }
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => {
            router.replace("/(tabs)/notes")
            return Promise.resolve()
          },
        })
      } else {
        Alert.alert(
          "Verification incomplete",
          "Additional fields are required. Try signing in instead."
        )
      }
    } catch (error) {
      Alert.alert("Verification failed", describeClerkError(error))
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
            <Text style={[styles.title, { color: palette.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              Your email must be on the BascyBros allowlist.
            </Text>
          </View>

          {pendingVerification ? (
            <View style={styles.form}>
              <Text style={[styles.label, { color: palette.text }]}>
                Enter the 6-digit code we just emailed you.
              </Text>
              <AppTextInput
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
              />
              <AppButton
                title="Verify email"
                size="lg"
                fullWidth
                loading={busy}
                onPress={handleVerify}
              />
            </View>
          ) : (
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
                placeholder="Password (min 8 chars)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
              />
              <AppButton
                title="Create account"
                size="lg"
                fullWidth
                loading={busy}
                onPress={handleStart}
              />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>
              Already have an account?{" "}
            </Text>
            <Link
              href="/sign-in"
              style={{ color: palette.link, fontSize: FontSize.sm, fontWeight: "600" }}
            >
              Sign in
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
  label: {
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
})
