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
              style={{
                color: active ? palette.primaryText : palette.text,
                fontSize: FontSize.sm,
                fontWeight: "500",
              }}
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
})
