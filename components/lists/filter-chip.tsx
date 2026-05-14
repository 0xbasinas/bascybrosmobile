import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

type Props = {
  label: string
  selected: boolean
  onPress: () => void
  accessibilityLabel: string
  disabled?: boolean
}

/**
 * Filter pills using core TouchableOpacity (not NativeWind Pressable) so taps
 * are reliable above sibling VirtualizedLists on Android.
 */
export function FilterChip({ label, selected, onPress, accessibilityLabel, disabled }: Props) {
  const palette = usePalette()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={styles.wrap}
    >
      <View
        style={[
          styles.pill,
          {
            borderColor: selected ? palette.primary : palette.border,
            backgroundColor: selected ? palette.primary : palette.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? palette.primaryText : palette.textMuted },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
})
