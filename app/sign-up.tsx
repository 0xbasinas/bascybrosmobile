import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useSignUp, useSSO } from "@clerk/expo"
import * as WebBrowser from "expo-web-browser"

import {
  AuthDivider,
  AuthErrorText,
  AuthHeader,
  authStyles,
} from "@/components/auth/primitives"
import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { Screen } from "@/components/ui/screen"
import { FontSize, usePalette } from "@/lib/theme"
import { checkEmailAllowed } from "@/lib/check-email"
import { describeClerkError } from "@/lib/clerk-errors"

WebBrowser.maybeCompleteAuthSession()

type Step = "email" | "password" | "code"

export default function SignUpScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { signUp, errors, fetchStatus } = useSignUp()
  const { startSSOFlow } = useSSO()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const loading = fetchStatus === "fetching"

  function reset() {
    setStep("email")
    setPassword("")
    setCode("")
    setError("")
  }

  async function finalize() {
    if (!signUp) return
    await signUp.finalize({
      navigate: () => {
        router.replace("/(tabs)/notes")
        return Promise.resolve()
      },
    })
  }

  async function handleEmailSubmit() {
    if (!signUp) return
    setError("")
    const trimmed = email.trim()
    if (!trimmed) {
      setError("Enter your email.")
      return
    }

    const allow = await checkEmailAllowed(trimmed)
    if (!allow.allowed) {
      setError(
        allow.reason ?? "Access restricted. This email is not on the allowlist."
      )
      return
    }

    const result = await signUp.create({ emailAddress: trimmed })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }

    if (signUp.status === "complete") {
      await finalize()
      return
    }

    if (signUp.status === "missing_requirements") {
      if (signUp.missingFields.includes("password")) {
        setStep("password")
        return
      }
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) {
        setError(describeClerkError(sent.error, "Couldn't send code."))
        return
      }
      setStep("code")
      return
    }

    const sent = await signUp.verifications.sendEmailCode()
    if (sent.error) {
      setError(describeClerkError(sent.error, "Couldn't send code."))
      return
    }
    setStep("code")
  }

  async function handlePasswordSubmit() {
    if (!signUp) return
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    const result = await signUp.password({ password })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }
    if (signUp.status === "complete") {
      await finalize()
      return
    }
    const sent = await signUp.verifications.sendEmailCode()
    if (sent.error) {
      setError(describeClerkError(sent.error, "Couldn't send code."))
      return
    }
    setStep("code")
  }

  async function handleCodeSubmit() {
    if (!signUp) return
    setError("")
    if (!code.trim()) {
      setError("Enter the 6-digit code.")
      return
    }
    const result = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }
    if (signUp.status === "complete") {
      await finalize()
      return
    }
    setError("Unexpected sign-up status. Please try again.")
  }

  async function handleGoogle() {
    setError("")
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: "bascybrosmobile://oauth-callback",
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        router.replace("/(tabs)/notes")
      } else {
        Alert.alert("Google sign-up incomplete", "Additional steps are required.")
      }
    } catch (err) {
      setError(describeClerkError(err, "Google sign-up failed."))
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={authStyles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === "email" && (
            <>
              <AuthHeader
                title="Create your account"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      style={{ color: palette.link, fontWeight: "600" }}
                    >
                      Sign in
                    </Link>
                  </>
                }
              />

              <View style={authStyles.form}>
                <AppTextInput
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
                <AuthErrorText local={error} globals={errors?.global} color={palette.danger} />
                <AppButton
                  title="Continue"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleEmailSubmit}
                />
                <AuthDivider
                  borderColor={palette.border}
                  mutedColor={palette.textMuted}
                  backgroundColor={palette.background}
                />
                <AppButton
                  title="Continue with Google"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onPress={handleGoogle}
                />
              </View>
            </>
          )}

          {step === "password" && (
            <>
              <AuthHeader
                title="Set your password"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                    Creating account for{" "}
                    <Text style={{ color: palette.text, fontWeight: "600" }}>{email}</Text>
                  </>
                }
              />

              <View style={authStyles.form}>
                <AppTextInput
                  placeholder="Password (min 8 chars)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <AuthErrorText local={error} globals={errors?.global} color={palette.danger} />
                <AppButton
                  title="Continue"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handlePasswordSubmit}
                />
              </View>

              <Pressable onPress={reset} hitSlop={6}>
                <Text
                  style={{
                    color: palette.textMuted,
                    fontSize: FontSize.sm,
                    textAlign: "center",
                  }}
                >
                  Back
                </Text>
              </Pressable>
            </>
          )}

          {step === "code" && (
            <>
              <AuthHeader
                title="Verify your email"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                    A code was sent to{" "}
                    <Text style={{ color: palette.text, fontWeight: "600" }}>{email}</Text>
                  </>
                }
              />

              <View style={authStyles.form}>
                <AppTextInput
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  editable={!loading}
                />
                <AuthErrorText local={error} globals={errors?.global} color={palette.danger} />
                <AppButton
                  title="Verify"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleCodeSubmit}
                />
              </View>

              <Pressable onPress={reset} hitSlop={6}>
                <Text
                  style={{
                    color: palette.textMuted,
                    fontSize: FontSize.sm,
                    textAlign: "center",
                  }}
                >
                  Back
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
