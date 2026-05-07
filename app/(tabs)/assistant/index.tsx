import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat } from "@/lib/types"

function formatDate(unix: number) {
  const date = new Date(unix * 1000)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export default function AssistantListScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const query = useQuery<{ ok: boolean; chats: AssistantChat[] }, HttpError>({
    queryKey: ["assistant-chats"],
    queryFn: () => requestJson("/api/assistant/chats"),
  })

  const create = useMutation<{ ok: boolean; chat: AssistantChat }, HttpError, void>({
    mutationFn: () =>
      requestJson("/api/assistant/chats", {
        method: "POST",
        body: { title: "New chat" },
      }),
    onSuccess: ({ chat }) => {
      queryClient.invalidateQueries({ queryKey: ["assistant-chats"] })
      router.push({
        pathname: "/(tabs)/assistant/[chatId]",
        params: { chatId: chat.id },
      })
    },
    onError: (err) => Alert.alert("Couldn't start chat", err.message),
  })

  const remove = useMutation<unknown, HttpError, string>({
    mutationFn: (id) => requestJson(`/api/assistant/chats/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assistant-chats"] }),
    onError: (err) => Alert.alert("Couldn't delete chat", err.message),
  })

  const chats = query.data?.chats ?? []

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.toolbar}>
        <AppButton
          title="New chat"
          loading={create.isPending}
          onPress={() => create.mutate()}
          style={{ flex: 1 }}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : query.error ? (
        <EmptyState title="Couldn't load chats" description={query.error.message} />
      ) : chats.length === 0 ? (
        <EmptyState
          title="No chats yet"
          description="Tap New chat to ask the assistant about your workspace."
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          renderItem={({ item }) => (
            <ChatRow
              chat={item}
              onDelete={() =>
                Alert.alert("Delete chat?", item.title, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => remove.mutate(item.id),
                  },
                ])
              }
            />
          )}
        />
      )}
    </View>
  )
}

function ChatRow({
  chat,
  onDelete,
}: {
  chat: AssistantChat
  onDelete: () => void
}) {
  const palette = usePalette()
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Link
        href={{ pathname: "/(tabs)/assistant/[chatId]", params: { chatId: chat.id } }}
        asChild
      >
        <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
          <Text
            style={{ color: palette.text, fontSize: FontSize.md, fontWeight: "600" }}
            numberOfLines={1}
          >
            {chat.title}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: FontSize.xs, marginTop: 4 }}>
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: Spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
