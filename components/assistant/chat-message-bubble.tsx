import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

import { MarkdownView } from "@/components/markdown"
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
        styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? palette.surfaceMuted : palette.background,
            maxWidth: isUser ? "88%" : "100%",
          },
        ]}
      >
        {isUser ? (
          <Text
            selectable
            style={{ color: palette.text, fontSize: FontSize.md, lineHeight: FontSize.md * 1.4 }}
          >
            {message.contentMarkdown}
          </Text>
        ) : (
          <View style={styles.assistantBody}>
            {isPendingEmpty ? (
              <View style={styles.pendingRow}>
                <ActivityIndicator color={palette.textMuted} size="small" />
                <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>Thinking...</Text>
              </View>
            ) : message.contentMarkdown ? (
              <MarkdownView markdown={message.contentMarkdown} />
            ) : (
              <ActivityIndicator color={palette.textMuted} size="small" />
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
  },
  rowUser: {
    alignItems: "flex-end",
  },
  rowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
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
})
