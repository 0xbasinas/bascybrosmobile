import type { ReactNode } from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Spacing, usePalette } from "@/lib/theme"

export function Screen({
  children,
  padded = true,
  scroll,
  style,
}: {
  children: ReactNode
  padded?: boolean
  scroll?: boolean
  style?: ViewStyle
}) {
  const palette = usePalette()
  void scroll

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.background }, style]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.container, padded ? { padding: Spacing.lg } : null]}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
})
