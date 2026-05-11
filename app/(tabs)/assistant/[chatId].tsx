import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { AppTextInput } from "@/components/ui/input"
import { MarkdownView } from "@/components/markdown"
import { LoadingState, PageSection } from "@/components/ui/page"
import { TabHero } from "@/components/ui/tab-hero"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { consumeAssistantStream } from "@/lib/assistant-stream"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { AssistantChat, AssistantMessage } from "@/lib/types"

type LiveMessage = AssistantMessage & { pending?: boolean }

export default function AssistantChatScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ chatId: string }>()
  const chatId = String(params.chatId ?? "")
  const { request, requestJson } = useApi()
  const queryClient = useQueryClient()

  const [prompt, setPrompt] = useState("")
  const [webSearch, setWebSearch] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([])
  const scrollRef = useRef<ScrollView | null>(null)
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
    if (query.data?.messages) {
      setLiveMessages(query.data.messages)
    }
  }, [query.data?.messages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  function appendLocalMessage(message: LiveMessage) {
    setLiveMessages((prev) => [...prev, message])
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    })
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={process.env.EXPO_OS === "ios" ? 80 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.transcript}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {query.data?.chat ? (
          <TabHero
            icon="sparkles-outline"
            eyebrow="Workspace chat"
            description={query.data.chat.title}
            stats={[
              { label: "Messages", value: String(liveMessages.length) },
              { label: "Mode", value: webSearch ? "Web + workspace" : "Workspace" },
            ]}
          />
        ) : null}
        {query.isLoading ? (
          <LoadingState label="Loading conversation..." style={styles.loading} />
        ) : query.error ? (
          <PageSection title="Couldn't load chat" contentStyle={styles.noticeContent}>
            <Text selectable style={{ color: palette.danger }}>
              {query.error.message}
            </Text>
          </PageSection>
        ) : liveMessages.length === 0 ? (
          <PageSection
            title="Start the conversation"
            description="Ask the assistant about your notes, tasks, CTFs, or anything else."
            contentStyle={styles.noticeContent}
          >
            <Text variant="muted" selectable>
              Turn on web search when you want live web results mixed into the answer.
            </Text>
          </PageSection>
        ) : (
          liveMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.composerOuter,
          {
            backgroundColor: palette.background,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
          },
        ]}
      >
        <View
          style={[
            styles.composerCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.composerToggleRow}>
            <View style={styles.toggleGroup}>
              <Switch value={webSearch} onValueChange={setWebSearch} />
              <Text variant="muted" selectable style={styles.toggleText}>
                Web search
              </Text>
            </View>
            {streaming ? (
              <Pressable
                onPress={handleStop}
                hitSlop={6}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text
                  selectable
                  style={{ color: palette.danger, fontSize: FontSize.xs, fontWeight: "600" }}
                >
                  Stop
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.composerRow}>
            <AppTextInput
              placeholder="Message the assistant..."
              value={prompt}
              onChangeText={setPrompt}
              multiline
              style={{ flex: 1, minHeight: 48, maxHeight: 140 }}
              editable={!streaming}
            />
            <Pressable
              onPress={handleSend}
              disabled={streaming || !prompt.trim()}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor:
                    streaming || !prompt.trim() ? palette.surfaceMuted : palette.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  streaming || !prompt.trim() ? palette.textMuted : palette.primaryText
                }
              />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

function MessageBubble({ message }: { message: LiveMessage }) {
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
  transcript: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loading: { padding: Spacing.xl, alignItems: "center" },
  noticeContent: {
    gap: Spacing.sm,
  },
  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "86%",
  },
  composerOuter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  composerCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  composerToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toggleText: {
    fontSize: FontSize.xs,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
})
