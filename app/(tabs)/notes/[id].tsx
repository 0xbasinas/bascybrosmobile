import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { MarkdownView } from "@/components/markdown"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { Note } from "@/lib/types"

export default function NoteDetailScreen() {
  const palette = usePalette()
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

  if (query.isLoading || !note) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
        }}
      >
        {query.error ? (
          <Text style={{ color: palette.danger, padding: Spacing.lg }}>
            {query.error.message}
          </Text>
        ) : (
          <ActivityIndicator color={palette.text} />
        )}
      </View>
    )
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
        {editing ? (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Title</Text>
              <AppTextInput value={title} onChangeText={setTitle} maxLength={200} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Tags</Text>
              <AppTextInput value={tags} onChangeText={setTags} autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Content (Markdown)</Text>
              <AppTextInput
                multiline
                value={content}
                onChangeText={setContent}
                style={{ minHeight: 320 }}
              />
            </View>

            <View style={styles.actionsRow}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setEditing(false)
                  setTitle(note.title)
                  setTags(note.tags)
                  setContent(note.contentMarkdown)
                }}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Save"
                onPress={handleSave}
                loading={save.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: palette.text }]}>{note.title}</Text>

            {note.tags ? (
              <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>
                {note.tags}
              </Text>
            ) : null}

            <View
              style={{
                borderRadius: Radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: palette.border,
                padding: Spacing.md,
                backgroundColor: palette.surface,
              }}
            >
              <MarkdownView markdown={note.contentMarkdown} />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.iconAction,
                  {
                    borderColor: palette.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={palette.danger} />
              </Pressable>
              <AppButton
                title="Edit note"
                fullWidth
                style={{ flex: 1 }}
                onPress={() => setEditing(true)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: FontSize.title, fontWeight: "700" },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: "500" },
  actionsRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  iconAction: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
