import { StyleSheet, View } from "react-native"

import { AppButton } from "@/components/ui/button"
import { PageSection } from "@/components/ui/page"
import { Spacing } from "@/lib/theme"

export function UploadsActions({
  busy,
  onCamera,
  onLibrary,
}: {
  busy: boolean
  onCamera: () => void
  onLibrary: () => void
}) {
  return (
    <PageSection contentStyle={styles.content}>
      <View style={styles.stack}>
        <AppButton title="Take photo" onPress={onCamera} loading={busy} fullWidth />
        <AppButton
          title="From library"
          variant="secondary"
          onPress={onLibrary}
          loading={busy}
          fullWidth
        />
      </View>
    </PageSection>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  stack: {
    gap: Spacing.sm,
  },
})
