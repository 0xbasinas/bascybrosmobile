import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/expo"
import { Redirect, useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useShareIntentContext } from "expo-share-intent"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { HttpError, useApi } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

function extractFirstHttpUrl(value: string): string | null {
  const match = value.match(/https?:\/\/\S+/i)
  return match?.[0] ?? null
}

function defaultTitleFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl)
    return `Shared from ${parsed.hostname}`
  } catch {
    return "Shared link"
  }
}

export default function ShareInboxScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { requestJson } = useApi()
  const { isLoaded, isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext()

  const incomingText = useMemo(() => shareIntent.text?.trim() ?? "", [shareIntent.text])
  const incomingUrl = useMemo(
    () => shareIntent.webUrl?.trim() ?? extractFirstHttpUrl(incomingText),
    [incomingText, shareIntent.webUrl]
  )
  const incomingTitle = useMemo(() => {
    const maybeTitle = shareIntent.meta?.title?.trim()
    if (maybeTitle) return maybeTitle
    if (incomingUrl) return defaultTitleFromUrl(incomingUrl)
    return "Shared note"
  }, [incomingUrl, shareIntent.meta?.title])

  const [title, setTitle] = useState(incomingTitle)
  const [tags, setTags] = useState("shared, mobile")
  const [content, setContent] = useState("")

  useEffect(() => {
    const chunks: string[] = []
    if (incomingUrl) {
      chunks.push(`[${incomingTitle}](${incomingUrl})`)
    }
    if (incomingText && incomingText !== incomingUrl) {
      chunks.push(incomingText)
    } else if (!incomingUrl && incomingText) {
      chunks.push(incomingText)
    }
    setTitle(incomingTitle)
    setContent(chunks.join("\n\n"))
  }, [incomingText, incomingTitle, incomingUrl])

  const create = useMutation<unknown, HttpError, void>({
    mutationFn: async () =>
      requestJson("/api/mobile/notes", {
        method: "POST",
        body: { title: title.trim(), contentMarkdown: content.trim(), tags: tags.trim() },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      resetShareIntent()
      Alert.alert("Saved", "Shared content was saved to your notes.")
      router.replace("/(tabs)/notes")
    },
    onError: (err) => Alert.alert("Couldn't save shared content", err.message),
  })

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing fields", "Title and content are required.")
      return
    }
    create.mutate()
  }

  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/sign-in" />

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.bannerTitle, { color: palette.text }]}>Shared content received</Text>
          <Text style={[styles.bannerText, { color: palette.textMuted }]}>
            {hasShareIntent ? "Review and save it as a note." : "No active shared content."}
          </Text>
          {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Title</Text>
          <AppTextInput
            placeholder="Note title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Tags (comma separated)</Text>
          <AppTextInput
            placeholder="e.g. shared, web"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Content (Markdown)</Text>
          <AppTextInput
            multiline
            placeholder="Shared text or link will appear here..."
            value={content}
            onChangeText={setContent}
            style={{ minHeight: 260 }}
          />
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Save as note"
            size="lg"
            fullWidth
            loading={create.isPending}
            onPress={handleSave}
          />
          <AppButton
            title="Clear shared content"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => {
              resetShareIntent()
              router.replace("/(tabs)/notes")
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  banner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  bannerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
  bannerText: {
    fontSize: FontSize.sm,
  },
  error: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  actions: {
    gap: Spacing.sm,
  },
})
