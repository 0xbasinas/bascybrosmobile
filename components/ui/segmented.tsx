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
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              active
                ? { backgroundColor: palette.primary }
                : { backgroundColor: "transparent" },
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
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
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingVertical: Spacing.sm - 1,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
    includeFontPadding: false,
  },
})
