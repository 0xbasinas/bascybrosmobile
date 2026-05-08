import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { MarkdownView } from "@/components/markdown"
import { Segmented } from "@/components/ui/segmented"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import { TASK_STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types"

const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: s === "in_progress" ? "In Prog." : TASK_STATUS_LABELS[s],
}))

export default function TaskDetailScreen() {
  const palette = usePalette()
  const router = useRouter()
  const params = useLocalSearchParams<{ id: string }>()
  const id = String(params.id ?? "")
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus] = useState<TaskStatus>("open")

  const query = useQuery<{ ok: boolean; task: Task }, HttpError>({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: () => requestJson(`/api/mobile/tasks/${id}`),
  })

  const task = query.data?.task

  useEffect(() => {
    if (task && !editing) {
      setTitle(task.title)
      setDetails(task.detailsMarkdown)
      setStatus(task.status)
    }
  }, [task, editing])

  const save = useMutation<unknown, HttpError, void>({
    mutationFn: () =>
      requestJson(`/api/mobile/tasks/${id}`, {
        method: "PATCH",
        body: {
          title: title.trim(),
          detailsMarkdown: details.trim(),
          status,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", id] })
      setEditing(false)
    },
    onError: (err) => Alert.alert("Couldn't save", err.message),
  })

  const remove = useMutation<unknown, HttpError, void>({
    mutationFn: () => requestJson(`/api/mobile/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      router.back()
    },
    onError: (err) => Alert.alert("Couldn't delete", err.message),
  })

  const setTaskStatus = useMutation<unknown, HttpError, TaskStatus>({
    mutationFn: (next) =>
      requestJson(`/api/mobile/tasks/${id}/status`, {
        method: "POST",
        body: { status: next },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", id] })
    },
    onError: (err) => Alert.alert("Couldn't update status", err.message),
  })

  function handleDelete() {
    Alert.alert("Delete task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate() },
    ])
  }

  if (query.isLoading || !task) {
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
              <Text style={[styles.label, { color: palette.text }]}>Status</Text>
              <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Details (Markdown)</Text>
              <AppTextInput
                multiline
                value={details}
                onChangeText={setDetails}
                style={{ minHeight: 240 }}
              />
            </View>

            <View style={styles.actionsRow}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setEditing(false)
                  setTitle(task.title)
                  setDetails(task.detailsMarkdown)
                  setStatus(task.status)
                }}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Save"
                loading={save.isPending}
                onPress={() => save.mutate()}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: palette.text }]}>{task.title}</Text>
            <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>
              {TASK_STATUS_LABELS[task.status]}
            </Text>

            <Segmented
              options={STATUS_OPTIONS}
              value={status}
              onChange={(next) => {
                if (setTaskStatus.isPending) return
                setStatus(next)
                setTaskStatus.mutate(next)
              }}
            />

            {task.detailsMarkdown ? (
              <View
                style={{
                  borderRadius: Radius.lg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.border,
                  padding: Spacing.md,
                  backgroundColor: palette.surface,
                }}
              >
                <MarkdownView markdown={task.detailsMarkdown} />
              </View>
            ) : (
              <Text style={{ color: palette.textMuted, fontSize: FontSize.sm }}>
                No details.
              </Text>
            )}

            <View style={styles.actionsRow}>
              <AppButton
                title="Delete"
                variant="danger"
                onPress={handleDelete}
                loading={remove.isPending}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Edit"
                onPress={() => setEditing(true)}
                style={{ flex: 1 }}
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
})
