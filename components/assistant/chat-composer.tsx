import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Switch, View } from "react-native"

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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          <Switch value={webSearch} onValueChange={onToggleWebSearch} />
          <Text variant="muted" selectable style={styles.toggleText}>
            Web search
          </Text>
        </View>
        {streaming ? (
          <Pressable
            onPress={onStop}
            hitSlop={6}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              selectable
              style={{ color: palette.danger, fontSize: FontSize.xs, fontWeight: "600" }}
            >
              Stop
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <AppTextInput
          placeholder="Message the assistant..."
          value={prompt}
          onChangeText={onPromptChange}
          multiline
          style={styles.input}
          editable={!streaming}
        />
        <Pressable
          onPress={onSend}
          disabled={streaming || !prompt.trim()}
          hitSlop={6}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor:
                streaming || !prompt.trim() ? palette.surfaceMuted : palette.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={streaming || !prompt.trim() ? palette.textMuted : palette.primaryText}
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
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
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
  },
  toggleText: {
    fontSize: FontSize.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
})
