import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { PageScrollView } from "@/components/ui/page"

export function AuthScreenShell({ children }: { children: ReactNode }) {
  return (
    <PageScrollView contentContainerStyle={styles.content}>
      <View style={styles.cardSlot}>{children}</View>
    </PageScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  cardSlot: {
    gap: 16,
  },
})
