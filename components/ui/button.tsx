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
    sm: { paddingVertical: 7, paddingHorizontal: 12, minHeight: 36, minWidth: 84 },
    md: { paddingVertical: 11, paddingHorizontal: 16, minHeight: 44, minWidth: 96 },
    lg: { paddingVertical: 13, paddingHorizontal: 18, minHeight: 50, minWidth: 112 },
  }[size]

  const fontSize = size === "sm" ? FontSize.sm : size === "lg" ? FontSize.md : FontSize.md

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
    lineHeight: 20,
    textAlign: "center",
    includeFontPadding: false,
  },
})
