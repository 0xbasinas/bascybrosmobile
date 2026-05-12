import { ActivityIndicator, StyleSheet, View } from "react-native"

import { MarkdownView } from "@/components/markdown"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { AssistantMessage } from "@/lib/types"

export type LiveMessage = AssistantMessage & { pending?: boolean }

export function ChatMessageBubble({ message }: { message: LiveMessage }) {
  const palette = usePalette()
  const isUser = message.role === "user"

  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: isUser ? palette.primary : palette.surface,
          borderColor: palette.border,
          alignSelf: isUser ? "flex-end" : "flex-start",
        },
      ]}
    >
      <Text
        style={{
          color: isUser ? palette.primaryText : palette.textMuted,
          fontSize: FontSize.xs,
          fontWeight: "600",
          marginBottom: 4,
        }}
        selectable
      >
        {isUser ? "You" : "Assistant"}
      </Text>
      {isUser ? (
        <Text selectable style={{ color: palette.primaryText, fontSize: FontSize.md, lineHeight: 22 }}>
          {message.contentMarkdown}
        </Text>
      ) : (
        <View>
          {message.contentMarkdown ? (
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
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "86%",
  },
})
