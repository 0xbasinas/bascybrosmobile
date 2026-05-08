import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { FontSize, Spacing } from "@/lib/theme"

export function AuthHeader({
  title,
  subtitle,
  color,
  mutedColor,
}: {
  title: string
  subtitle: ReactNode
  color: string
  mutedColor: string
}) {
  return (
    <View style={authStyles.header}>
      <Text style={[authStyles.title, { color }]}>{title}</Text>
      <Text style={[authStyles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
    </View>
  )
}

export function AuthErrorText({
  local,
  globals,
  color,
}: {
  local: string
  globals: readonly { longMessage?: string; message?: string }[] | null | undefined
  color: string
}) {
  if (local) {
    return <Text style={{ color, fontSize: FontSize.sm }}>{local}</Text>
  }
  if (globals && globals.length > 0) {
    const first = globals[0]
    const text = first?.longMessage || first?.message
    if (text) return <Text style={{ color, fontSize: FontSize.sm }}>{text}</Text>
  }
  return null
}

export function AuthDivider({
  borderColor,
  mutedColor,
  backgroundColor,
  label = "Or",
}: {
  borderColor: string
  mutedColor: string
  backgroundColor: string
  label?: string
}) {
  return (
    <View style={[authStyles.divider, { borderColor }]}>
      <Text
        style={[
          authStyles.dividerText,
          { color: mutedColor, backgroundColor },
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

export function AuthLinkButton({
  label,
  onPress,
  color,
  disabled,
}: {
  label: string
  onPress: () => void
  color: string
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed || disabled ? 0.5 : 1 })}
    >
      <Text
        style={{
          color,
          fontSize: FontSize.sm,
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export const authStyles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    gap: Spacing.xl,
  },
  header: { gap: Spacing.sm, alignItems: "center" },
  title: {
    fontSize: FontSize.title,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: { fontSize: FontSize.md, textAlign: "center" },
  form: { gap: Spacing.md },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    fontWeight: "500",
    marginTop: -8,
  },
  linkColumn: { gap: Spacing.sm, alignItems: "center" },
})
