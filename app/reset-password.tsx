import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { ResetPasswordForm } from "@/components/reset-password-form"
import { LoadingScreen } from "@/components/ui/page"

export default function ResetPasswordScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading reset flow..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell
      title="Choose a new password"
      description="Use the verification code from your email to secure your BascyBros account."
    >
      <ResetPasswordForm />
    </AuthScreenShell>
  )
}
