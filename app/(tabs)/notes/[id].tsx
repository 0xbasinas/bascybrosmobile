import { useHeaderHeight } from "@react-navigation/elements"
import { useEffect, useState } from "react"
import { Alert, StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { NoteFields } from "@/components/notes/note-fields"
import { FormKeyboardSafeScroll } from "@/components/ui/form-keyboard-safe-scroll"
import { MarkdownView } from "@/components/markdown"
import { EmptyState } from "@/components/ui/empty"
import { LoadingScreen, PageScrollView, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { Spacing } from "@/lib/theme"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function formatDate(unix: number) {
  const date = new Date(unix * 1000)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function NoteDetailScreen() {
  const headerHeight = useHeaderHeight()
  const router = useRouter()
  const params = useLocalSearchParams<{ id: string }>()
  const id = String(params.id ?? "")
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [content, setContent] = useState("")

  const query = useQuery<{ ok: boolean; note: Note }, HttpError>({
    queryKey: ["note", id],
    enabled: !!id,
    queryFn: () => requestJson(`/api/mobile/notes/${id}`),
  })

  const note = query.data?.note

  useEffect(() => {
    if (note && !editing) {
      setTitle(note.title)
      setTags(note.tags)
      setContent(note.contentMarkdown)
    }
  }, [note, editing])

  const save = useMutation<unknown, HttpError, void>({
    mutationFn: () =>
      requestJson(`/api/mobile/notes/${id}`, {
        method: "PATCH",
        body: { title: title.trim(), contentMarkdown: content.trim(), tags: tags.trim() },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["note", id] })
      setEditing(false)
    },
    onError: (err) => Alert.alert("Couldn't save", err.message),
  })

  const remove = useMutation<unknown, HttpError, void>({
    mutationFn: () => requestJson(`/api/mobile/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      router.back()
    },
    onError: (err) => Alert.alert("Couldn't delete", err.message),
  })

  function handleDelete() {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate() },
    ])
  }

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing fields", "Title and content are required.")
      return
    }
    save.mutate()
  }

  if (query.isLoading) {
    return <LoadingScreen label="Loading note..." />
  }

  if (query.error || !note) {
    return (
      <PageScrollView>
        <PageSection contentStyle={styles.errorCard}>
          <EmptyState
            title="Couldn't load note"
            description={query.error?.message ?? "This note is no longer available."}
          />
        </PageSection>
      </PageScrollView>
    )
  }

  return (
    <FormKeyboardSafeScroll headerHeight={headerHeight}>
      {editing ? (
        <PageSection
          title="Make changes"
          description="Refine the structure first, then update the markdown body."
          footer={
            <>
              <AppButton
                title="Cancel"
                variant="outline"
                fullWidth
                onPress={() => {
                  setEditing(false)
                  setTitle(note.title)
                  setTags(note.tags)
                  setContent(note.contentMarkdown)
                }}
              />
              <AppButton
                title="Save"
                onPress={handleSave}
                loading={save.isPending}
                fullWidth
              />
            </>
          }
          footerStyle={styles.footer}
        >
          <NoteFields
            title={title}
            tags={tags}
            content={content}
            onTitleChange={setTitle}
            onTagsChange={setTags}
            onContentChange={setContent}
            contentMinHeight={300}
            titleDescription="Keep the note name concise and recognizable."
            tagsDescription="Comma-separated tags power note filtering."
            contentDescription="Markdown changes save directly back to this note."
          />
        </PageSection>
      ) : (
        <PageSection
          title={note.title}
          description={
            note.tags
              ? splitTags(note.tags)
                  .map((t) => `#${t}`)
                  .join(" · ")
              : "No tags yet."
          }
          contentStyle={styles.sectionContent}
          footer={
            <>
              <AppButton
                title="Delete note"
                variant="danger"
                fullWidth
                onPress={handleDelete}
                loading={remove.isPending}
              />
              <AppButton
                title="Edit note"
                variant="outline"
                fullWidth
                onPress={() => setEditing(true)}
              />
            </>
          }
          footerStyle={styles.footer}
        >
          <Text variant="muted" selectable>
            Updated {formatDate(note.updatedAt)}
          </Text>
          <MarkdownView markdown={note.contentMarkdown} />
        </PageSection>
      )}
    </FormKeyboardSafeScroll>
  )
}

const styles = StyleSheet.create({
  errorCard: {
    minHeight: 220,
  },
  sectionContent: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: "column",
    gap: Spacing.sm,
  },
})
