import { Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignInForm } from "@/components/sign-in-form"
import { LoadingScreen } from "@/components/ui/page"

export default function SignInScreen() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen label="Loading sign in..." />
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell
      title="Welcome back"
      description="Sign in to access your BascyBros workspace."
    >
      <SignInForm />
    </AuthScreenShell>
  )
}
