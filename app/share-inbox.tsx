import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/expo"
import { Redirect, useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useShareIntentContext } from "expo-share-intent"
import { Alert, StyleSheet } from "react-native"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { PageField, PageScrollView, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { HttpError, useApi } from "@/lib/api"
import { Spacing } from "@/lib/theme"

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

/**
 * Handles common Chrome/Android share formats:
 *   - "Page Title\nhttps://..."        (Chrome share)
 *   - "https://..."                     (plain URL)
 *   - "Some text with https://... in it"
 *   - webUrl set directly by the OS
 */
function parseSharePayload(intent: {
  text?: string | null
  webUrl?: string | null
  meta?: { title?: string | null } | null
}): ParsedShare {
  const rawText = intent.text?.trim() ?? ""

  // URL: prefer the explicit webUrl field, then extract from text
  const url =
    normalizeHttpUrl(intent.webUrl) ??
    normalizeHttpUrl(extractFirstHttpUrl(rawText))

  // Title priority:
  //   1. meta.title  (some Android apps/browsers include this)
  //   2. Text that appears before the URL in the shared string
  //      e.g. Chrome shares "Page Title\nhttps://..."
  //   3. Hostname fallback
  const metaTitle = intent.meta?.title?.trim()
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
  const router = useRouter()
  const { requestJson } = useApi()
  const { isLoaded, isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext()

  const { url: incomingUrl, title: incomingTitle } = useMemo(
    () => parseSharePayload(shareIntent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shareIntent.text, shareIntent.webUrl, shareIntent.meta?.title]
  )

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
    <PageScrollView keyboardAvoiding>
      <PageSection
        title="Shared content ready"
        description={
          hasShareIntent
            ? "Review the captured link or text before saving it as a note."
            : "There is no active share payload right now."
        }
        contentStyle={styles.bannerContent}
      >
        <Text variant="muted" selectable>
          Only the shared URL or text is stored. Edit the title, tags, and markdown below before saving.
        </Text>
        {error ? (
          <Text selectable style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </PageSection>

      <PageSection
        title="Save to notes"
        description="Turn the shared content into a searchable note."
        contentStyle={styles.formContent}
        footer={
          <>
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
          </>
        }
        footerStyle={styles.footer}
      >
        <PageField label="Title" description="Use something recognizable in your note list.">
          <AppTextInput
            placeholder="Note title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </PageField>

        <PageField label="Tags" description="Comma-separated tags help group imported content.">
          <AppTextInput
            placeholder="e.g. shared, web"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />
        </PageField>

        <PageField label="Content" description="Shared text or the captured link will appear here.">
          <AppTextInput
            multiline
            placeholder="Shared text or link will appear here..."
            value={content}
            onChangeText={setContent}
            style={styles.editor}
          />
        </PageField>
      </PageSection>
    </PageScrollView>
  )
}

const styles = StyleSheet.create({
  bannerContent: {
    gap: Spacing.lg,
  },
  errorText: {
    color: "#dc2626",
  },
  formContent: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: "column",
    gap: Spacing.sm,
  },
  editor: {
    minHeight: 260,
  },
})
