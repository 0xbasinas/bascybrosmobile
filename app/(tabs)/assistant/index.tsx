import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
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
      <View style={styles.pagePadding}>
        <PageSection
          title="Workspace assistant"
          description="Keep ongoing chats about notes, tasks, and your broader workspace."
          contentStyle={styles.toolbarSection}
        >
          <AppButton
            title="New chat"
            loading={create.isPending}
            onPress={() => create.mutate()}
            fullWidth
          />
        </PageSection>
      </View>

      {query.isLoading ? (
        <View style={styles.statePadding}>
          <LoadingState label="Loading chats..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.statePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load chats" description={query.error.message} />
          </PageSection>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.statePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState
              title="No chats yet"
              description="Tap New chat to ask the assistant about your workspace."
            />
          </PageSection>
        </View>
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
          ListHeaderComponent={
            <PageSection
              title={`${chats.length} ${chats.length === 1 ? "conversation" : "conversations"}`}
              description="Open a thread to continue where you left off."
              contentStyle={styles.summaryContent}
            >
              <Text variant="muted" selectable>
                Long press delete on a card whenever you want to clear an old thread.
              </Text>
            </PageSection>
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
    <PageSection contentStyle={styles.rowContent}>
      <View style={styles.row}>
        <Link
          href={{ pathname: "/(tabs)/assistant/[chatId]", params: { chatId: chat.id } }}
          asChild
        >
          <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {chat.title}
            </Text>
            <Text variant="muted" selectable style={styles.rowMeta}>
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
  container: { flex: 1 },
  pagePadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  toolbarSection: {
    gap: Spacing.md,
  },
  statePadding: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stateFill: {
    flex: 1,
  },
  stateCard: { minHeight: 220 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  summaryContent: {
    gap: Spacing.xs,
  },
  rowContent: {
    padding: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  rowMeta: {
    marginTop: 4,
  },
})
