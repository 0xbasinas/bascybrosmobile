import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Switch, Text, TextInput, View, Platform } from "react-native"

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
  const canSend = !streaming && Boolean(prompt.trim())

  return (
    <View style={[styles.wrap, { backgroundColor: palette.surfaceMuted }]}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          <Switch
            value={webSearch}
            onValueChange={onToggleWebSearch}
            disabled={streaming}
            trackColor={{ false: palette.surface, true: palette.primary }}
            thumbColor={
              Platform.OS === "android"
                ? webSearch
                  ? palette.primaryText
                  : palette.surface
                : undefined
            }
            ios_backgroundColor={palette.surface}
          />
          <Text style={[styles.toggleText, { color: palette.textMuted }]}>Web search</Text>
        </View>
        {streaming ? (
          <Pressable
            onPress={onStop}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: 4 })}
          >
            <Text style={{ color: palette.danger, fontSize: FontSize.sm, fontWeight: "600" }}>
              Stop
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Message..."
          placeholderTextColor={palette.textMuted}
          value={prompt}
          onChangeText={onPromptChange}
          multiline
          editable={!streaming}
          accessibilityLabel="Message input"
          style={[
            styles.input,
            {
              color: palette.text,
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
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
              backgroundColor: canSend ? palette.primary : palette.surface,
              borderColor: palette.border,
              opacity: pressed && canSend ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? palette.primaryText : palette.textMuted}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.md,
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
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 160,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: FontSize.md,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
})
