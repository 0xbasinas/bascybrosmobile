import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, View } from "react-native"

import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { usePalette } from "@/lib/theme"
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
    <View className="mb-3 flex-row items-stretch gap-2">
      <Link href={{ pathname: "/(tabs)/assistant/[chatId]", params: { chatId: chat.id } }} asChild>
        <Pressable className="min-w-0 flex-1 active:opacity-90">
          <Card className="flex-1 flex-col gap-1 py-4 pl-4 pr-3 shadow-sm shadow-black/5">
            <Text className="text-base font-semibold leading-snug" numberOfLines={2}>
              {chat.title}
            </Text>
            <Text variant="muted" className="text-xs font-medium tracking-wide" numberOfLines={1}>
              Updated {formatDate(chat.updatedAt)}
            </Text>
          </Card>
        </Pressable>
      </Link>
      <Pressable
        hitSlop={12}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete chat"
        className="w-11 items-center justify-center rounded-xl border border-border bg-card active:opacity-80"
      >
        <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
      </Pressable>
    </View>
  )
}
