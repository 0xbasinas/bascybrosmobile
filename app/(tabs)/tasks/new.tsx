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
import { Segmented } from "@/components/ui/segmented"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/types"

const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}))

export default function NewTaskScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus] = useState<TaskStatus>("open")

  const create = useMutation<unknown, HttpError, void>({
    mutationFn: () =>
      requestJson("/api/mobile/tasks", {
        method: "POST",
        body: {
          title: title.trim(),
          detailsMarkdown: details.trim(),
          status,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      router.back()
    },
    onError: (err) => Alert.alert("Couldn't create task", err.message),
  })

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Tasks need a title.")
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
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Status</Text>
          <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Details (Markdown)</Text>
          <AppTextInput
            multiline
            placeholder="Optional notes..."
            value={details}
            onChangeText={setDetails}
            style={{ minHeight: 220 }}
          />
        </View>

        <AppButton
          title="Create task"
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
  container: { padding: Spacing.lg, gap: Spacing.lg },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: "500" },
})
