import { forwardRef } from "react"
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
} from "react-native"

import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

export type AppTextInputProps = TextInputProps & {
  multiline?: boolean
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  function AppTextInput({ style, multiline, ...rest }, ref) {
    const palette = usePalette()

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        {...rest}
        style={[
          styles.input,
          {
            color: palette.text,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            minHeight: multiline ? 120 : 44,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
    )
  }
)

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
  },
})
