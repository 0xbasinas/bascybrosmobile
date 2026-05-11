import { Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignUpForm } from "@/components/sign-up-form"
import { LoadingScreen } from "@/components/ui/page"

export default function SignUpScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading sign up..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell
      title="Create your account"
      description="Set up your BascyBros account and start organizing your work."
    >
      <SignUpForm />
    </AuthScreenShell>
  )
}
