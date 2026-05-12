import { Redirect, useLocalSearchParams } from "expo-router"
import { useAuth } from "@clerk/expo"

import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignInForm } from "@/components/sign-in-form"
import { LoadingScreen } from "@/components/ui/page"

function parseAddAccount(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === "1" || value === "true"
}

export default function SignInScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const { addAccount } = useLocalSearchParams<{ addAccount?: string | string[] }>()
  const isAddingAccount = parseAddAccount(addAccount)

  if (!isLoaded) {
    return <LoadingScreen label="Loading sign in..." />
  }

  if (isSignedIn && !isAddingAccount) {
    return <Redirect href="/(tabs)/notes" />
  }

  return (
    <AuthScreenShell
      title={isAddingAccount ? "Add another account" : "Welcome back"}
      description={
        isAddingAccount
          ? "Sign in with a different account. Enable multi-session in the Clerk Dashboard (Sessions) if adding accounts is blocked."
          : "Sign in to access your BascyBros workspace."
      }
    >
      <SignInForm isAddingAccount={isAddingAccount} />
    </AuthScreenShell>
  )
}
