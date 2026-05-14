import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, StyleSheet, Text, View, Platform } from "react-native"

import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat } from "@/lib/types"

function formatDate(unix: number) {
  const date = new Date(unix * 1000)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function ChatRow({
  chat,
  onDelete,
}: {
  chat: AssistantChat
  onDelete: () => void
}) {
  const palette = usePalette()

  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <View style={[styles.accent, { backgroundColor: palette.border }]} />
      <Link href={{ pathname: "/(tabs)/assistant/[chatId]", params: { chatId: chat.id } }} asChild>
        <Pressable style={({ pressed }) => [styles.body, { opacity: pressed ? 0.72 : 1 }]}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
            {chat.title}
          </Text>
          <Text style={[styles.meta, { color: palette.textMuted }]} numberOfLines={1}>
            Updated {formatDate(chat.updatedAt)}
          </Text>
        </Pressable>
      </Link>
      <Pressable
        hitSlop={10}
        onPress={onDelete}
        style={({ pressed }) => [
          styles.trashHit,
          { opacity: pressed ? 0.55 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Delete chat"
      >
        <Ionicons name="trash-outline" size={18} color={palette.textMuted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: Spacing.md,
    paddingRight: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accent: {
    width: 3,
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 2,
    marginRight: Spacing.md,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
    lineHeight: FontSize.md * 1.25,
  },
  meta: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.15,
  },
  trashHit: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
})
