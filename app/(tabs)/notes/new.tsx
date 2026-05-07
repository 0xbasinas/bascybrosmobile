import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Spacing, usePalette } from "@/lib/theme"

export default function NewNoteScreen() {
  const palette = usePalette()
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
            placeholder="e.g. xss, web, recon"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Content (Markdown)</Text>
          <AppTextInput
            multiline
            placeholder="Write your note in Markdown..."
            value={content}
            onChangeText={setContent}
            style={{ minHeight: 280 }}
          />
        </View>

        <AppButton
          title="Save note"
          size="lg"
          fullWidth
          loading={create.isPending}
          onPress={handleSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: "500" },
})
