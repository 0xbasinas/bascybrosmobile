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
          backgroundColor: palette.surface,
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
              active ? { backgroundColor: palette.primary } : { backgroundColor: "transparent" },
              pressed ? { opacity: 0.88 } : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? palette.primaryText : palette.text,
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
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    includeFontPadding: false,
  },
})
