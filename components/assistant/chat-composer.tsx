import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Switch, View, Platform, useColorScheme } from "react-native"

import { AppTextInput } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

export function ChatComposer({
  prompt,
  streaming,
  webSearch,
  onPromptChange,
  onToggleWebSearch,
  onSend,
  onStop,
}: {
  prompt: string
  streaming: boolean
  webSearch: boolean
  onPromptChange: (value: string) => void
  onToggleWebSearch: (value: boolean) => void
  onSend: () => void
  onStop: () => void
}) {
  const palette = usePalette()
  const colorScheme = useColorScheme()
  const canSend = !streaming && Boolean(prompt.trim())

  const cardShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: palette.text,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: colorScheme === "dark" ? 0.35 : 0.12,
          shadowRadius: 10,
        }
      : { elevation: 4 }

  return (
    <View
      style={[
        styles.card,
        cardShadow,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          <Switch
            value={webSearch}
            onValueChange={onToggleWebSearch}
            disabled={streaming}
            trackColor={{ false: palette.surfaceMuted, true: palette.primary }}
            thumbColor={Platform.OS === "android" ? (webSearch ? palette.primaryText : palette.surface) : undefined}
            ios_backgroundColor={palette.surfaceMuted}
          />
          <Text variant="muted" selectable style={styles.toggleText}>
            Web search
          </Text>
        </View>
        {streaming ? (
          <Pressable
            onPress={onStop}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              selectable
              style={{ color: palette.danger, fontSize: FontSize.sm, fontWeight: "600" }}
            >
              Stop
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <AppTextInput
          placeholder="Message the assistant…"
          value={prompt}
          onChangeText={onPromptChange}
          multiline
          style={styles.input}
          editable={!streaming}
          accessibilityLabel="Message input"
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend ? palette.primary : palette.surfaceMuted,
              opacity: pressed && canSend ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={22}
            color={canSend ? palette.primaryText : palette.textMuted}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    flexShrink: 1,
  },
  toggleText: {
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 160,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
    fontSize: FontSize.md,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
})
