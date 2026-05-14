import { Ionicons } from "@expo/vector-icons"
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ChatRow } from "@/components/assistant/chat-row"
import { UserMenu } from "@/components/user-menu"
import { LoadingState } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat } from "@/lib/types"

const TAB_BAR_OFFSET = 58
const TOUCH = 44

export default function AssistantListScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
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
  const bottomPad = TAB_BAR_OFFSET + Math.max(insets.bottom, Spacing.md) + Spacing.xl
  const showInitialLoading = query.isLoading && !query.data

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Spacing.sm),
          },
        ]}
      >
        <View style={{ flex: 1 }} />
        <UserMenu />
      </View>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>Workspace</Text>
        <Text style={[styles.screenTitle, { color: palette.text }]}>Assistant</Text>
        <Pressable
          onPress={() => create.mutate()}
          disabled={create.isPending}
          style={({ pressed }) => [
            styles.newRow,
            { borderBottomColor: palette.border, opacity: pressed ? 0.72 : create.isPending ? 0.5 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
        >
          <View style={[styles.newIcon, { backgroundColor: palette.surfaceMuted }]}>
            {create.isPending ? (
              <Ionicons name="hourglass-outline" size={20} color={palette.textMuted} />
            ) : (
              <Ionicons name="add" size={22} color={palette.text} />
            )}
          </View>
          <Text style={[styles.newLabel, { color: palette.text }]}>New chat</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {query.isError ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Could not load chats</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>{query.error.message}</Text>
          </View>
        ) : showInitialLoading ? (
          <View style={styles.centerBlock}>
            <LoadingState label="Loading chats..." />
          </View>
        ) : chats.length === 0 ? (
          <View style={[styles.centerBlock, { paddingHorizontal: Spacing.xl }]}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No conversations yet</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Start a chat to ask about your notes, tasks, or anything else in plain language.
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            style={styles.flexList}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  flexList: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    minHeight: TOUCH,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: FontSize.title,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -0.8 : 0,
    marginBottom: Spacing.md,
  },
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  newIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    maxWidth: 420,
    alignSelf: "center",
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.45,
    textAlign: "center",
  },
})
