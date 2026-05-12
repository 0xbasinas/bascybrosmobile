import { useEffect, useRef, useState } from "react"
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ChatComposer } from "@/components/assistant/chat-composer"
import { ChatMessageBubble, type LiveMessage } from "@/components/assistant/chat-message-bubble"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { consumeAssistantStream } from "@/lib/assistant-stream"
import { Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat, AssistantMessage } from "@/lib/types"

export default function AssistantChatScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const params = useLocalSearchParams<{ chatId: string }>()
  const chatId = String(params.chatId ?? "")
  const { request, requestJson } = useApi()
  const queryClient = useQueryClient()

  const [prompt, setPrompt] = useState("")
  const [webSearch, setWebSearch] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([])
  const listRef = useRef<FlatList<LiveMessage>>(null)
  const abortRef = useRef<AbortController | null>(null)

  const query = useQuery<
    { ok: boolean; chat: AssistantChat; messages: AssistantMessage[] },
    HttpError
  >({
    queryKey: ["assistant-chat", chatId],
    enabled: !!chatId,
    queryFn: () => requestJson(`/api/assistant/chats/${chatId}`),
  })

  useEffect(() => {
    setLiveMessages([])
  }, [chatId])

  useEffect(() => {
    if (query.data?.messages) {
      setLiveMessages(query.data.messages)
    }
  }, [query.data?.messages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  function scrollToEnd(animated: boolean) {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated })
    })
  }

  function appendLocalMessage(message: LiveMessage) {
    setLiveMessages((prev) => [...prev, message])
    scrollToEnd(true)
  }

  function updatePending(updater: (current: LiveMessage) => LiveMessage) {
    setLiveMessages((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].pending) {
          next[i] = updater(next[i])
          return next
        }
      }
      return prev
    })
  }

  async function handleSend() {
    const trimmed = prompt.trim()
    if (!trimmed || streaming) return
    if (!chatId) return

    const now = Math.floor(Date.now() / 1000)
    appendLocalMessage({
      id: `local-user-${now}`,
      chatId,
      role: "user",
      contentMarkdown: trimmed,
      metadataJson: null,
      createdAt: now,
    })
    appendLocalMessage({
      id: `local-pending-${now}`,
      chatId,
      role: "assistant",
      contentMarkdown: "",
      metadataJson: null,
      createdAt: now,
      pending: true,
    })

    setPrompt("")
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await request("/api/assistant/stream", {
        method: "POST",
        body: {
          chatId,
          prompt: trimmed,
          contextMode: "workspace",
          webSearch,
          apiKeySource: "env",
        },
        signal: controller.signal,
      })

      await consumeAssistantStream(
        response,
        {
          onText: ({ accumulated }) =>
            updatePending((current) => ({ ...current, contentMarkdown: accumulated })),
          onDone: () => {
            updatePending((current) => ({ ...current, pending: false }))
            queryClient.invalidateQueries({ queryKey: ["assistant-chat", chatId] })
            queryClient.invalidateQueries({ queryKey: ["assistant-chats"] })
          },
          onError: (message) => {
            updatePending((current) => ({
              ...current,
              pending: false,
              contentMarkdown:
                current.contentMarkdown ||
                `_Assistant error: ${message.replace(/[_*`]/g, "")}_`,
            }))
            Alert.alert("Assistant error", message)
          },
          onRateLimited: (retryAfterSeconds) => {
            updatePending((current) => ({
              ...current,
              pending: false,
              contentMarkdown:
                current.contentMarkdown ||
                "_Rate-limited by OpenRouter. Try again in a moment._",
            }))
            Alert.alert(
              "Rate limited",
              retryAfterSeconds
                ? `Try again in ${retryAfterSeconds}s.`
                : "OpenRouter is throttling — wait a few seconds."
            )
          },
        },
        controller.signal
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Stream failed."
      updatePending((current) => ({
        ...current,
        pending: false,
        contentMarkdown: current.contentMarkdown || `_${msg}_`,
      }))
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setStreaming(false)
    updatePending((current) => ({
      ...current,
      pending: false,
      contentMarkdown: current.contentMarkdown || "_Stopped._",
    }))
  }

  const emptyMinHeight = Math.min(windowHeight * 0.5, 420)

  const listEmpty = (
    <View style={[styles.emptyWrap, { minHeight: emptyMinHeight }]}>
      {query.isLoading ? (
        <LoadingState label="Loading conversation..." style={styles.loading} />
      ) : query.error ? (
        <PageSection title="Couldn't load chat" contentStyle={styles.noticeContent}>
          <Text selectable style={{ color: palette.danger }}>
            {query.error.message}
          </Text>
        </PageSection>
      ) : (
        <PageSection
          title="Start the conversation"
          description="Ask the assistant about your notes, tasks, CTFs, or anything else."
          contentStyle={styles.noticeContent}
        >
          <Text variant="muted" selectable>
            Turn on web search when you want live web results mixed into the answer.
          </Text>
        </PageSection>
      )}
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={process.env.EXPO_OS === "ios" ? 80 : 0}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        data={liveMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageBubble message={item} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={<View style={{ height: Spacing.sm }} />}
        contentContainerStyle={[
          styles.transcript,
          liveMessages.length === 0 ? styles.transcriptEmpty : null,
        ]}
        onContentSizeChange={() => scrollToEnd(false)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
        contentInsetAdjustmentBehavior="automatic"
      />

      <View
        style={[
          styles.composerOuter,
          {
            backgroundColor: palette.background,
            borderTopColor: palette.border,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
          },
        ]}
      >
        <ChatComposer
          prompt={prompt}
          streaming={streaming}
          webSearch={webSearch}
          onPromptChange={setPrompt}
          onToggleWebSearch={setWebSearch}
          onSend={handleSend}
          onStop={handleStop}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  transcript: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  transcriptEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loading: { padding: Spacing.xl, alignItems: "center" },
  noticeContent: {
    gap: Spacing.sm,
  },
  composerOuter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
