import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"

import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
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
    <PageSection contentStyle={styles.content}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={16} color={palette.text} />
        </View>
        <Link href={{ pathname: "/(tabs)/assistant/[chatId]", params: { chatId: chat.id } }} asChild>
          <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}>
            <Text style={styles.title} numberOfLines={1}>
              {chat.title}
            </Text>
            <Text variant="muted" selectable style={styles.meta}>
              Updated {formatDate(chat.updatedAt)}
            </Text>
          </Pressable>
        </Link>
        <Pressable
          hitSlop={6}
          onPress={onDelete}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
        >
          <Ionicons name="trash-outline" size={18} color={palette.danger} />
        </Pressable>
      </View>
    </PageSection>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  meta: {
    marginTop: 4,
  },
})
