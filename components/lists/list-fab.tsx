import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, useColorScheme } from "react-native"

import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight"
import { Spacing, usePalette } from "@/lib/theme"

const FAB_SIZE = 56
const FAB_HALO_PAD = 8
const FAB_BACKDROP_SIZE = FAB_SIZE + FAB_HALO_PAD * 2

/**
 * Tab scenes already end above the tab bar (default React Navigation layout).
 * Do not add tab bar height again here — that double-counts and lifts the FAB too high.
 * @see https://reactnavigation.org/docs/bottom-tab-navigator/#usebottomtabbarheight
 */
const FAB_MARGIN_FROM_SCENE_BOTTOM = Spacing.lg

type IonName = ComponentProps<typeof Ionicons>["name"]

function FabPlusMark({ color }: { color: string }) {
  const thick = 3
  const arm = 20
  return (
    <View style={styles.plusContainer} pointerEvents="none" collapsable={false}>
      <View style={[styles.plusBarH, { width: arm, height: thick, borderRadius: thick / 2, backgroundColor: color }]} />
      <View
        style={[
          styles.plusBarV,
          { width: thick, height: arm, borderRadius: thick / 2, backgroundColor: color },
        ]}
      />
    </View>
  )
}

export function ListFab({
  onPress,
  accessibilityLabel,
  disabled,
  loading,
  icon = "add",
  /**
   * When `false`, ignore keyboard height for positioning. Use when this tab's list stays
   * mounted under a stack screen (e.g. notes new/edit) so the FAB does not jump with the
   * child screen's keyboard.
   */
  useKeyboardInset = true,
}: {
  onPress: () => void
  accessibilityLabel: string
  disabled?: boolean
  loading?: boolean
  icon?: IonName
  useKeyboardInset?: boolean
}) {
  const palette = usePalette()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const keyboardHeight = useKeyboardHeight()
  const bottom = FAB_MARGIN_FROM_SCENE_BOTTOM + (useKeyboardInset ? keyboardHeight : 0)

  /** Foreground on `palette.primary` (same role as buttons using primary fill). */
  const onPrimary = palette.primaryText
  const ripple = isDark ? "rgba(250, 250, 250, 0.12)" : "rgba(28, 25, 23, 0.08)"

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: Spacing.lg - FAB_HALO_PAD,
        bottom: bottom - FAB_HALO_PAD,
        zIndex: 50,
        elevation: 50,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        android_ripple={{ color: ripple }}
        style={({ pressed }) => [
          styles.outerHit,
          {
            opacity: disabled && !loading ? 0.45 : 1,
            transform: [{ scale: pressed && !disabled && !loading ? 0.97 : 1 }],
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.45 : 0.12,
                shadowRadius: 8,
              },
              android: { elevation: 10 },
            }),
          },
        ]}
      >
        <View
          style={[
            styles.innerDisc,
            {
              backgroundColor: palette.primary,
              borderColor: palette.border,
              ...Platform.select({
                ios: {
                  shadowColor: isDark ? "#fafaf9" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.35 : 0.2,
                  shadowRadius: 5,
                },
                android: { elevation: 3 },
              }),
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={onPrimary} />
          ) : icon === "add" ? (
            <FabPlusMark color={onPrimary} />
          ) : (
            <Ionicons name={icon} size={26} color={onPrimary} />
          )}
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  outerHit: {
    width: FAB_BACKDROP_SIZE,
    height: FAB_BACKDROP_SIZE,
    borderRadius: FAB_BACKDROP_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDisc: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  plusContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  plusBarH: {},
  plusBarV: {
    position: "absolute",
  },
})

/** FlatList / SectionList `paddingBottom` so the last row clears the FAB (tab bar is outside the scene). */
export const LIST_FAB_CLEARANCE = FAB_BACKDROP_SIZE + FAB_MARGIN_FROM_SCENE_BOTTOM + Spacing.md
