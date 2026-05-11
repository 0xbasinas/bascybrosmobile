import { useState } from "react"
import { Alert, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { useApi, HttpError } from "@/lib/api"
import { PageField, PageScrollView, PageSection } from "@/components/ui/page"
import { Spacing } from "@/lib/theme"

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
        title="New note"
        description="Capture a thought, finding, or checklist in markdown."
        contentStyle={styles.sectionContent}
        footer={
          <AppButton
            title="Save note"
            size="lg"
            fullWidth
            loading={create.isPending}
            onPress={handleSave}
          />
        }
        footerStyle={styles.footer}
      >
        <PageField label="Title" description="Give this note a clear name.">
          <AppTextInput
            placeholder="Note title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </PageField>

        <PageField label="Tags" description="Comma-separated labels help filter notes later.">
          <AppTextInput
            placeholder="e.g. xss, web, recon"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />
        </PageField>

        <PageField label="Content" description="Markdown is supported for longer notes.">
          <AppTextInput
            multiline
            placeholder="Write your note in Markdown..."
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
  sectionContent: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: "column",
  },
  editor: {
    minHeight: 280,
  },
})
