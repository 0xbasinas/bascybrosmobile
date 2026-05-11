import { useState } from "react"
import { Alert, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { PageField, PageScrollView, PageSection } from "@/components/ui/page"
import { Segmented } from "@/components/ui/segmented"
import { TabHero } from "@/components/ui/tab-hero"
import { useApi, HttpError } from "@/lib/api"
import { Spacing } from "@/lib/theme"
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/types"

const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: s === "in_progress" ? "In Prog." : TASK_STATUS_LABELS[s],
}))

export default function NewTaskScreen() {
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
    <PageScrollView keyboardAvoiding>
      <TabHero
        icon="add-circle-outline"
        eyebrow="Plan work"
        description="Create something actionable, choose where it starts, and add context if you need it."
        stats={[
          { label: "Starting status", value: TASK_STATUS_LABELS[status] },
          { label: "Details", value: details.trim() ? "Added" : "Optional" },
        ]}
      />
      <PageSection
        title="Set up the task"
        description="Keep the title scannable and add supporting notes only where they help."
        contentStyle={styles.sectionContent}
        footer={
          <AppButton
            title="Create task"
            size="lg"
            fullWidth
            loading={create.isPending}
            onPress={handleSave}
          />
        }
        footerStyle={styles.footer}
      >
        <PageField label="Title" description="A short summary of the work to do.">
          <AppTextInput
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </PageField>

        <PageField label="Status" description="Choose the starting column for this task.">
          <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </PageField>

        <PageField label="Details" description="Optional markdown notes, context, or acceptance criteria.">
          <AppTextInput
            multiline
            placeholder="Optional notes..."
            value={details}
            onChangeText={setDetails}
            style={styles.editor}
          />
        </PageField>
      </PageSection>
    </PageScrollView>
  )
}

const styles = StyleSheet.create({
  sectionContent: { gap: Spacing.lg },
  footer: {
    flexDirection: "column",
  },
  editor: {
    minHeight: 220,
  },
})
