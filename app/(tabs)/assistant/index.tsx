import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { ChatRow } from "@/components/assistant/chat-row"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat } from "@/lib/types"

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
      <View style={styles.topPadding}>
        <PageSection contentStyle={styles.headerCard}>
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
          contentInsetAdjustmentBehavior="automatic"
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  topPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statePadding: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  stateFill: {
    flex: 1,
  },
  stateCard: { minHeight: 220 },
  headerCard: {
    gap: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
})
