import { useHeaderHeight } from "@react-navigation/elements"
import { useState } from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { NoteFields } from "@/components/notes/note-fields"
import { FormKeyboardSafeScroll } from "@/components/ui/form-keyboard-safe-scroll"
import { useApi, HttpError } from "@/lib/api"
import { Spacing } from "@/lib/theme"
import { PageSection } from "@/components/ui/page"

export default function NewNoteScreen() {
  const headerHeight = useHeaderHeight()
  const router = useRouter()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [content, setContent] = useState("")

  const create = useMutation<unknown, HttpError, void>({
    mutationFn: async () =>
      requestJson("/api/mobile/notes", {
        method: "POST",
        body: { title: title.trim(), contentMarkdown: content.trim(), tags: tags.trim() },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      router.back()
    },
    onError: (err) => Alert.alert("Couldn't save note", err.message),
  })

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing fields", "Title and content are required.")
      return
    }
    create.mutate()
  }

  return (
    <FormKeyboardSafeScroll headerHeight={headerHeight}>
      <PageSection
        title="New note"
        description="Give it a clear title, optional tags, then write in Markdown."
      >
        <NoteFields
          title={title}
          tags={tags}
          content={content}
          onTitleChange={setTitle}
          onTagsChange={setTags}
          onContentChange={setContent}
          contentMinHeight={280}
        />
      </PageSection>
      <AppButton
        title="Save note"
        size="lg"
        fullWidth
        loading={create.isPending}
        onPress={handleSave}
        style={{ marginTop: Spacing.lg }}
      />
    </FormKeyboardSafeScroll>
  )
}
