import { ActivityIndicator, StyleSheet, View } from "react-native"

import { MarkdownView } from "@/components/markdown"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { AssistantMessage } from "@/lib/types"

export type LiveMessage = AssistantMessage & { pending?: boolean }

export function ChatMessageBubble({ message }: { message: LiveMessage }) {
  const palette = usePalette()
  const isUser = message.role === "user"
  const isPendingEmpty = Boolean(message.pending) && !message.contentMarkdown.trim()

  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: isUser ? palette.primary : palette.surfaceMuted,
          borderColor: palette.border,
          alignSelf: isUser ? "flex-end" : "flex-start",
          borderTopLeftRadius: Radius.lg,
          borderTopRightRadius: Radius.lg,
          borderBottomRightRadius: isUser ? Radius.sm : Radius.lg,
          borderBottomLeftRadius: isUser ? Radius.lg : Radius.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.roleLabel,
          { color: isUser ? palette.primaryText : palette.textMuted },
        ]}
        selectable
      >
        {isUser ? "You" : "Assistant"}
      </Text>
      {isUser ? (
        <Text
          selectable
          style={{ color: palette.primaryText, fontSize: FontSize.md, lineHeight: 22 }}
        >
          {message.contentMarkdown}
        </Text>
      ) : (
        <View style={styles.assistantBody}>
          {isPendingEmpty ? (
            <View style={styles.pendingRow}>
              <ActivityIndicator color={palette.textMuted} />
              <Text variant="muted" style={styles.pendingLabel}>
                Thinking…
              </Text>
            </View>
          ) : message.contentMarkdown ? (
            <MarkdownView markdown={message.contentMarkdown} />
          ) : (
            <ActivityIndicator color={palette.textMuted} />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "90%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  roleLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  assistantBody: {
    gap: Spacing.sm,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  pendingLabel: {
    fontSize: FontSize.sm,
  },
})
