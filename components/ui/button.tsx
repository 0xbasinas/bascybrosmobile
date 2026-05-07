import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

export type AppButtonProps = Omit<PressableProps, "style" | "children"> & {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
}

export function AppButton({
  title,
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  style,
  disabled,
  ...rest
}: AppButtonProps) {
  const palette = usePalette()
  const isDisabled = disabled || loading

  const sizeStyle = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 32 },
    md: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40 },
    lg: { paddingVertical: 14, paddingHorizontal: 18, minHeight: 48 },
  }[size]

  const fontSize = size === "sm" ? FontSize.sm : size === "lg" ? FontSize.lg : FontSize.md

  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: palette.primary }
      : variant === "secondary"
        ? { backgroundColor: palette.surfaceMuted }
        : variant === "outline"
          ? {
              backgroundColor: "transparent",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.border,
            }
          : variant === "danger"
            ? { backgroundColor: palette.danger }
            : { backgroundColor: "transparent" }

  const textColor =
    variant === "primary"
      ? palette.primaryText
      : variant === "danger"
        ? "#ffffff"
        : palette.text

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle,
        fullWidth ? { alignSelf: "stretch" } : null,
        pressed ? { opacity: 0.85 } : null,
        isDisabled ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  text: {
    fontWeight: "600",
  },
})
