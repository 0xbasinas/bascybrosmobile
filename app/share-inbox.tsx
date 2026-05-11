import { useEffect, useState } from "react"
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
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { HttpError, useApi } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

function extractFirstHttpUrl(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s]+/i)
  if (!match?.[0]) return null
  // Strip common trailing punctuation that gets caught by \S+
  return match[0].replace(/[)\].,!?;:'""]+$/, "")
}

function normalizeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

function defaultTitleFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl)
    return `Shared from ${parsed.hostname}`
  } catch {
    return "Shared link"
  }
}

interface ParsedShare {
  url: string | null
  title: string | null
}

function firstSharedString(value: unknown): string | null {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = firstSharedString(item)
      if (nested) return nested
    }
  }
  return null
}

/**
 * Handles common Chrome/Android share formats:
 *   - "Page Title\nhttps://..."        (Chrome share)
 *   - "https://..."                     (plain URL)
 *   - "Some text with https://... in it"
 *   - webUrl set directly by the OS
 */
function parseSharePayload(intent: {
  text?: unknown
  webUrl?: unknown
  meta?: { title?: unknown } | null
} | null | undefined): ParsedShare {
  const rawText = firstSharedString(intent?.text)?.trim() ?? ""

  // URL: prefer the explicit webUrl field, then extract from text
  const url =
    normalizeHttpUrl(firstSharedString(intent?.webUrl)) ??
    normalizeHttpUrl(extractFirstHttpUrl(rawText))

  // Title priority:
  //   1. meta.title  (some Android apps/browsers include this)
  //   2. Text that appears before the URL in the shared string
  //      e.g. Chrome shares "Page Title\nhttps://..."
  //   3. Hostname fallback
  const metaTitle = firstSharedString(intent?.meta?.title)?.trim()
  if (metaTitle) return { url, title: metaTitle }

  if (url && rawText) {
    const urlPos = rawText.search(/https?:\/\//i)
    if (urlPos > 0) {
      const candidate = rawText.slice(0, urlPos).trim()
      // Accept as title: non-empty, not itself a URL, not too long
      if (candidate && candidate.length <= 200 && !/https?:\/\//i.test(candidate)) {
        // Collapse any newlines in the candidate (multiple title lines)
        return { url, title: candidate.replace(/\s*\n\s*/g, " ") }
      }
    }
  }

  return { url, title: url ? defaultTitleFromUrl(url) : null }
}

export default function ShareInboxScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { requestJson } = useApi()
  const { isLoaded, isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext()

  const { url: incomingUrl, title: incomingTitle } = parseSharePayload(shareIntent)

  const [title, setTitle] = useState(incomingTitle ?? "Shared note")
  const [tags, setTags] = useState("shared, mobile")
  const [content, setContent] = useState("")

  useEffect(() => {
    setTitle(incomingTitle ?? "Shared note")
    setContent(incomingUrl ?? "")
  }, [incomingTitle, incomingUrl])

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
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, Spacing.md) + Spacing.sm,
            paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.banner, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.bannerTitle, { color: palette.text }]}>Shared content ready</Text>
          <Text style={[styles.bannerText, { color: palette.textMuted }]}>
            {hasShareIntent ? "Only the shared URL is saved." : "No active shared content."}
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
    paddingHorizontal: Spacing.lg,
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
