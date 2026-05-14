import type { ReactNode } from "react"
import { Platform, StyleSheet, View } from "react-native"
import {
  KeyboardAwareScrollView,
  useResizeMode,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PageScrollView, type PageScrollViewProps } from "@/components/ui/page"
import { Spacing, usePalette } from "@/lib/theme"

type Props = {
  headerHeight: number
  children: ReactNode
} & Omit<
  PageScrollViewProps,
  "keyboardAvoiding" | "keyboardVerticalOffset" | "extraKeyboardBottomGap" | "ref"
>

/**
 * Long forms (notes, tasks): on native, `KeyboardAwareScrollView` keeps the focused field
 * above the keyboard. Must render under `KeyboardProvider` (see `app/_layout.tsx`).
 * Web uses `PageScrollView` keyboard padding.
 */
export function FormKeyboardSafeScroll({
  headerHeight,
  children,
  contentContainerStyle,
  style,
  padded = true,
  ...rest
}: Props) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const baseBottom = Math.max(insets.bottom, Spacing.lg) + Spacing.lg

  if (Platform.OS === "web") {
    return (
      <View style={styles.flex}>
        <PageScrollView
          padded={padded}
          keyboardAvoiding
          keyboardVerticalOffset={headerHeight}
          extraKeyboardBottomGap={Spacing.xl}
          style={style}
          contentContainerStyle={contentContainerStyle}
          {...rest}
        >
          {children}
        </PageScrollView>
      </View>
    )
  }

  return (
    <FormKeyboardNativeScroll
      palette={palette}
      headerHeight={headerHeight}
      baseBottom={baseBottom}
      padded={padded}
      contentContainerStyle={contentContainerStyle}
      style={style}
      rest={rest}
    >
      {children}
    </FormKeyboardNativeScroll>
  )
}

function FormKeyboardNativeScroll({
  palette,
  headerHeight,
  baseBottom,
  padded,
  children,
  contentContainerStyle,
  style,
  rest,
}: {
  palette: ReturnType<typeof usePalette>
  headerHeight: number
  baseBottom: number
  padded: boolean
  children: ReactNode
  contentContainerStyle?: PageScrollViewProps["contentContainerStyle"]
  style?: PageScrollViewProps["style"]
  rest: Omit<
    Props,
    "headerHeight" | "children" | "contentContainerStyle" | "style" | "padded"
  >
}) {
  useResizeMode()

  const scrollStyle: KeyboardAwareScrollViewProps["style"] = [{ flex: 1, backgroundColor: palette.background }, style]
  const scrollContent: KeyboardAwareScrollViewProps["contentContainerStyle"] = [
    styles.scrollContent,
    {
      paddingTop: Spacing.lg,
      paddingBottom: baseBottom + Spacing.xxl,
    },
    padded ? { paddingHorizontal: Spacing.lg } : null,
    contentContainerStyle,
  ]

  return (
    <KeyboardAwareScrollView
      {...rest}
      style={scrollStyle}
      contentContainerStyle={scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator
      bottomOffset={Spacing.xl + Spacing.sm}
      extraKeyboardSpace={Spacing.lg + Math.min(headerHeight, 72)}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    gap: Spacing.lg,
  },
})
