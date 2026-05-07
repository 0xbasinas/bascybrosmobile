import { StyleSheet, Text, View } from "react-native"

import { FontSize, Spacing, usePalette } from "@/lib/theme"

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const palette = usePalette()
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: palette.textMuted }]}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "600",
  },
  description: {
    fontSize: FontSize.sm,
    textAlign: "center",
  },
})
