import { useState } from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { NoteFields } from "@/components/notes/note-fields"
import { useApi, HttpError } from "@/lib/api"
import { PageScrollView, PageSection } from "@/components/ui/page"

export default function NewNoteScreen() {
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
    <PageScrollView keyboardAvoiding>
      <PageSection
        title="Write your note"
        description="Add the structure first, then drop in as much markdown detail as you need."
        footer={
          <AppButton
            title="Save note"
            size="lg"
            fullWidth
            loading={create.isPending}
            onPress={handleSave}
          />
        }
        footerStyle={{ flexDirection: "column" }}
      >
        <NoteFields
          title={title}
          tags={tags}
          content={content}
          onTitleChange={setTitle}
          onTagsChange={setTags}
          onContentChange={setContent}
          contentMinHeight={320}
        />
      </PageSection>
    </PageScrollView>
  )
}
