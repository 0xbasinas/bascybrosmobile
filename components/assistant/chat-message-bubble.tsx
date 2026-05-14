import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

import { MarkdownView } from "@/components/markdown"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { AssistantMessage } from "@/lib/types"

export type LiveMessage = AssistantMessage & { pending?: boolean }

export function ChatMessageBubble({ message }: { message: LiveMessage }) {
  const palette = usePalette()
  const isUser = message.role === "user"
  const isPendingEmpty = Boolean(message.pending) && !message.contentMarkdown.trim()

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View
          style={[
            styles.bubbleUser,
            { backgroundColor: palette.surfaceMuted },
          ]}
        >
          <Text
            selectable
            style={[styles.userText, { color: palette.text }]}
          >
            {message.contentMarkdown}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.row, styles.rowAssistant]}>
      <View style={[styles.assistantStripe, { backgroundColor: palette.border }]} />
      <View style={styles.assistantCol}>
        {isPendingEmpty ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator color={palette.textMuted} size="small" />
            <Text style={[styles.mutedSmall, { color: palette.textMuted }]}>Thinking…</Text>
          </View>
        ) : message.contentMarkdown ? (
          <MarkdownView markdown={message.contentMarkdown} />
        ) : (
          <ActivityIndicator color={palette.textMuted} size="small" />
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
    paddingLeft: Spacing.xxl,
  },
  rowAssistant: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing.md,
    paddingRight: Spacing.sm,
  },
  assistantStripe: {
    width: 2,
    borderRadius: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  assistantCol: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  bubbleUser: {
    maxWidth: "90%",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  userText: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.45,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  mutedSmall: {
    fontSize: FontSize.sm,
  },
})
