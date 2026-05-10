import { useEffect, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useAuth, useSignIn, useSSO } from "@clerk/expo"
import * as WebBrowser from "expo-web-browser"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { Screen } from "@/components/ui/screen"
import {
  AuthDivider,
  AuthErrorText,
  AuthHeader,
  AuthLinkButton,
  authStyles,
} from "@/components/auth/primitives"
import { usePalette } from "@/lib/theme"
import { checkEmailAllowed } from "@/lib/check-email"
import { describeClerkError } from "@/lib/clerk-errors"
import { AUTH_REDIRECT_URL } from "@/lib/auth-redirect"
import { usePostAuthHref } from "@/lib/share-auth-routing"

WebBrowser.maybeCompleteAuthSession()

type Step = "email" | "password" | "code" | "mfa"
type MfaMethod = "email_code" | "totp" | "backup_code"

export default function SignInScreen() {
  const palette = usePalette()
  const router = useRouter()
  const postAuthHref = usePostAuthHref()
  const { signIn, errors, fetchStatus } = useSignIn()
  const { startSSOFlow } = useSSO()
  const { isSignedIn } = useAuth()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [mfaMethod, setMfaMethod] = useState<MfaMethod | null>(null)
  const [error, setError] = useState("")

  const loading = fetchStatus === "fetching"

  useEffect(() => {
    if (isSignedIn) {
      router.replace(postAuthHref)
    }
  }, [isSignedIn, postAuthHref, router])

  function reset() {
    setStep("email")
    setPassword("")
    setCode("")
    setMfaMethod(null)
    setError("")
  }

  async function finalize() {
    if (!signIn) return
    await signIn.finalize({
      navigate: () => {
        router.replace(postAuthHref)
        return Promise.resolve()
      },
    })
  }

  async function goMfa() {
    if (!signIn) return false
    const factors = signIn.supportedSecondFactors ?? []
    if (factors.some((f) => f.strategy === "email_code")) {
      setMfaMethod("email_code")
      const sent = await signIn.mfa.sendEmailCode()
      if (sent.error) {
        setError(describeClerkError(sent.error, "Couldn't send code."))
        return false
      }
      setStep("mfa")
      return true
    }
    if (factors.some((f) => f.strategy === "totp")) {
      setMfaMethod("totp")
      setStep("mfa")
      return true
    }
    if (factors.some((f) => f.strategy === "backup_code")) {
      setMfaMethod("backup_code")
      setStep("mfa")
      return true
    }
    return false
  }

  async function handleEmailSubmit() {
    if (!signIn) return
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

    const result = await signIn.create({ identifier: trimmed })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }

    if (signIn.status === "complete") {
      await finalize()
      return
    }
    if (signIn.status === "needs_first_factor") {
      setStep("password")
      return
    }
    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const ok = await goMfa()
      if (!ok) setError("No supported verification method found.")
      return
    }

    setError("Unexpected sign-in status. Please try again.")
  }

  async function handlePasswordSubmit() {
    if (!signIn) return
    setError("")
    if (!password) {
      setError("Enter your password.")
      return
    }

    const result = await signIn.password({ password })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }

    if (signIn.status === "complete") {
      await finalize()
      return
    }
    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const ok = await goMfa()
      if (!ok) setError("No supported verification method found.")
      return
    }

    setError("Unexpected sign-in status. Please try again.")
  }

  async function handleSwitchToCode() {
    if (!signIn) return
    setError("")
    const sent = await signIn.emailCode.sendCode()
    if (sent.error) {
      setError(describeClerkError(sent.error, "Couldn't send code."))
      return
    }
    setStep("code")
  }

  async function handleCodeSubmit() {
    if (!signIn) return
    setError("")
    if (!code.trim()) {
      setError("Enter the 6-digit code.")
      return
    }
    const result = await signIn.emailCode.verifyCode({ code: code.trim() })
    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }
    if (signIn.status === "complete") {
      await finalize()
      return
    }
    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const ok = await goMfa()
      if (!ok) setError("No supported verification method found.")
      return
    }
    setError("Unexpected sign-in status. Please try again.")
  }

  async function handleMfaSubmit() {
    if (!signIn) return
    setError("")
    if (!code.trim()) {
      setError("Enter the verification code.")
      return
    }

    let result: { error: { longMessage?: string; message?: string } | null }
    if (mfaMethod === "email_code") {
      result = await signIn.mfa.verifyEmailCode({ code: code.trim() })
    } else if (mfaMethod === "totp") {
      result = await signIn.mfa.verifyTOTP({ code: code.trim() })
    } else if (mfaMethod === "backup_code") {
      result = await signIn.mfa.verifyBackupCode({ code: code.trim() })
    } else {
      setError("Unknown MFA method.")
      return
    }

    if (result.error) {
      setError(describeClerkError(result.error))
      return
    }
    if (signIn.status === "complete") {
      await finalize()
      return
    }
    setError("MFA verification failed. Please try again.")
  }

  async function handleResendMfaEmail() {
    if (!signIn) return
    const sent = await signIn.mfa.sendEmailCode()
    if (sent.error) {
      setError(describeClerkError(sent.error, "Couldn't resend code."))
    } else {
      setError("")
    }
  }

  async function handleGoogle() {
    setError("")
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AUTH_REDIRECT_URL,
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        router.replace(postAuthHref)
      } else {
        Alert.alert(
          "Google sign-in incomplete",
          "Additional steps are required. Try email + password instead."
        )
      }
    } catch (err) {
      setError(describeClerkError(err, "Google sign-in failed."))
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
                title="Sign in to BascyBros"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    style={{ color: palette.link, fontWeight: "600" }}
                  >
                    Sign up
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
                title="Enter your password"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                    Signing in as{" "}
                    <Text style={{ color: palette.text, fontWeight: "600" }}>{email}</Text>
                  </>
                }
              />

              <View style={authStyles.form}>
                <AppTextInput
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <AuthErrorText local={error} globals={errors?.global} color={palette.danger} />
                <AppButton
                  title="Sign in"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handlePasswordSubmit}
                />
              </View>

              <View style={authStyles.linkColumn}>
                <AuthLinkButton
                  label="Use verification code instead"
                  onPress={handleSwitchToCode}
                  color={palette.link}
                  disabled={loading}
                />
                <AuthLinkButton
                  label="Back"
                  onPress={reset}
                  color={palette.textMuted}
                />
              </View>
            </>
          )}

          {step === "code" && (
            <>
              <AuthHeader
                title="Check your email"
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

              <View style={authStyles.linkColumn}>
                <AuthLinkButton
                  label="Back"
                  onPress={reset}
                  color={palette.textMuted}
                />
              </View>
            </>
          )}

          {step === "mfa" && (
            <>
              <AuthHeader
                title="Two-factor authentication"
                color={palette.text}
                mutedColor={palette.textMuted}
                subtitle={
                  <>
                    {mfaMethod === "email_code" &&
                      "A verification code was sent to your email."}
                    {mfaMethod === "totp" &&
                      "Enter the code from your authenticator app."}
                    {mfaMethod === "backup_code" && "Enter one of your backup codes."}
                  </>
                }
              />

              <View style={authStyles.form}>
                <AppTextInput
                  placeholder={mfaMethod === "backup_code" ? "Backup code" : "123456"}
                  keyboardType={mfaMethod === "backup_code" ? "default" : "number-pad"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={mfaMethod === "backup_code" ? 16 : 6}
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
                  onPress={handleMfaSubmit}
                />
              </View>

              <View style={authStyles.linkColumn}>
                {mfaMethod === "email_code" && (
                  <AuthLinkButton
                    label="Resend code"
                    onPress={handleResendMfaEmail}
                    color={palette.link}
                  />
                )}
                <AuthLinkButton
                  label="Back"
                  onPress={reset}
                  color={palette.textMuted}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
