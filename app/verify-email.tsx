import { useAuth } from "@clerk/expo"
import { Redirect } from "expo-router"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { VerifyEmailForm } from "@/components/verify-email-form"
import { LoadingScreen } from "@/components/ui/page"

export default function VerifyEmailScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading verification..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell>
      <VerifyEmailForm />
    </AuthScreenShell>
  )
}
