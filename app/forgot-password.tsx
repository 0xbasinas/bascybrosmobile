import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { LoadingScreen } from "@/components/ui/page"

export default function ForgotPasswordScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading reset flow..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell
      title="Reset your password"
      description="Enter your email and we’ll send you a code to get back into BascyBros."
    >
      <ForgotPasswordForm />
    </AuthScreenShell>
  )
}
