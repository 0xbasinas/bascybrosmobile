import { useIsFocused } from "@react-navigation/native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useCallback, useMemo } from "react"
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ChatRow } from "@/components/assistant/chat-row"
import { LIST_FAB_CLEARANCE, ListFab } from "@/components/lists/list-fab"
import { ListHero } from "@/components/lists/list-hero"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState } from "@/components/ui/page"
import { UserMenu } from "@/components/user-menu"
import { HttpError, useApi } from "@/lib/api"
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight"
import { Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat } from "@/lib/types"

export default function AssistantListScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const listFocused = useIsFocused()
  const keyboardHeight = useKeyboardHeight()
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

  const chats = useMemo(() => query.data?.chats ?? [], [query.data?.chats])
  const bottomPad = LIST_FAB_CLEARANCE + (listFocused ? keyboardHeight : 0)
  const showInitialLoading = query.isLoading && !query.data

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerBlock}>
        <ListHero eyebrow="Workspace" title="Assistant" />
      </View>
    ),
    [],
  )

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyInList}>
        <EmptyState
          title="No conversations yet"
          description="Ask about your notes, tasks, or anything else. Use the round add button to start a new chat."
        />
      </View>
    ),
    [],
  )

  return (
    <View className="flex-1" style={{ backgroundColor: palette.background }}>
      <View
        className="flex-row items-center justify-end px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top, Spacing.sm) }}
      >
        <UserMenu />
      </View>

      {query.isError ? (
        <View style={styles.centerBlock}>
          <EmptyState title="Couldn't load chats" description={query.error.message} />
        </View>
      ) : showInitialLoading ? (
        <View style={styles.centerBlock}>
          <LoadingState label="Loading chats..." />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          style={styles.flexList}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
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

      {!query.isError && !showInitialLoading ? (
        <ListFab
          useKeyboardInset={listFocused}
          onPress={() => create.mutate()}
          accessibilityLabel="Start a new chat"
          loading={create.isPending}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  headerBlock: {
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  emptyInList: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
    minHeight: 220,
    justifyContent: "center",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    maxWidth: 420,
    alignSelf: "center",
  },
})
