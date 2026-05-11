import { useRouter } from "expo-router"
import { useClerk } from "@clerk/expo"
import { StyleSheet } from "react-native"

import { AppButton } from "@/components/ui/button"
import { PageScrollView, PageSection } from "@/components/ui/page"
import { TabHero } from "@/components/ui/tab-hero"
import { Spacing } from "@/lib/theme"

export default function UnauthorizedScreen() {
  const router = useRouter()
  const { signOut } = useClerk()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.replace("/sign-in")
    }
  }

  return (
    <PageScrollView contentContainerStyle={styles.content}>
      <TabHero
        icon="lock-closed-outline"
        eyebrow="Access restricted"
        description="This account is signed in, but its email is not on the BascyBros allowlist yet."
      />
      <PageSection
        title="What to do next"
        description="Ask an admin to add your email address, then sign in again to continue."
        contentStyle={styles.sectionContent}
        footerStyle={styles.footer}
      >
        <AppButton title="Sign out" variant="outline" fullWidth onPress={handleSignOut} />
      </PageSection>
    </PageScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  sectionContent: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: "column",
  },
})
