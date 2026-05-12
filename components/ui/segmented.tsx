import { Pressable, StyleSheet, Text, View } from "react-native"

import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

export type SegmentOption<T extends string> = {
  value: T
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (next: T) => void
}) {
  const palette = usePalette()
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: active ? palette.primary : palette.surface,
                opacity: pressed ? 0.94 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? palette.primaryText : palette.text,
                  flexShrink: 0,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    includeFontPadding: false,
  },
})
