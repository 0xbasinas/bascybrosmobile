import type { ReactNode } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Screen } from "@/components/ui/screen"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Spacing, usePalette } from "@/lib/theme"

type PageScrollViewProps = ScrollViewProps & {
  padded?: boolean
  keyboardAvoiding?: boolean
  keyboardVerticalOffset?: number
}

export function PageScrollView({
  children,
  padded = true,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  style,
  ...props
}: PageScrollViewProps) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()

  const scrollView = (
    <ScrollView
      {...props}
      style={[styles.flex, { backgroundColor: palette.background }, style]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? "handled"}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Spacing.lg,
          paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.lg,
        },
        padded ? { paddingHorizontal: Spacing.lg } : null,
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  )

  if (!keyboardAvoiding) {
    return scrollView
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollView}
    </KeyboardAvoidingView>
  )
}

export function PageSection({
  title,
  description,
  children,
  footer,
  style,
  contentStyle,
  footerStyle,
}: {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  footerStyle?: StyleProp<ViewStyle>
}) {
  return (
    <Card style={style} className="w-full shrink-0">
      {title || description ? (
        <CardHeader style={styles.sectionHeader}>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent style={[styles.sectionContent, contentStyle]}>{children}</CardContent>
      {footer ? <CardFooter style={[styles.sectionFooter, footerStyle]}>{footer}</CardFooter> : null}
    </Card>
  )
}

export function PageField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text variant="small">{label}</Text>
        {description ? (
          <Text variant="muted" selectable>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}

export function LoadingState({
  label,
  style,
}: {
  label?: string
  style?: StyleProp<ViewStyle>
}) {
  const palette = usePalette()

  return (
    <View style={[styles.loading, style]}>
      <ActivityIndicator color={palette.text} />
      {label ? (
        <Text variant="muted" selectable>
          {label}
        </Text>
      ) : null}
    </View>
  )
}

export function LoadingScreen({ label }: { label?: string }) {
  return (
    <Screen>
      <LoadingState label={label} style={styles.flex} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    gap: Spacing.lg,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionContent: {
    gap: Spacing.md,
  },
  sectionFooter: {
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldHeader: {
    gap: Spacing.xs,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
})
