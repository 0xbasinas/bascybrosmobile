import { useEffect, useState } from "react"
import { Alert, StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { MarkdownView } from "@/components/markdown"
import { EmptyState } from "@/components/ui/empty"
import { LoadingScreen, PageField, PageScrollView, PageSection } from "@/components/ui/page"
import { Segmented } from "@/components/ui/segmented"
import { TabHero } from "@/components/ui/tab-hero"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { Spacing } from "@/lib/theme"
import { TASK_STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types"

const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({
  value: s,
  label: s === "in_progress" ? "In Prog." : TASK_STATUS_LABELS[s],
}))

export default function TaskDetailScreen() {
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

  if (query.isLoading) {
    return <LoadingScreen label="Loading task..." />
  }

  if (query.error || !task) {
    return (
      <PageScrollView>
        <PageSection contentStyle={styles.errorCard}>
          <EmptyState
            title="Couldn't load task"
            description={query.error?.message ?? "This task is no longer available."}
          />
        </PageSection>
      </PageScrollView>
    )
  }

  return (
    <PageScrollView keyboardAvoiding>
      <TabHero
        icon={editing ? "create-outline" : "checkmark-done-outline"}
        eyebrow={editing ? "Editing task" : "Task overview"}
        description={editing ? "Adjust the title, status, or supporting markdown details." : task.title}
        stats={[
          { label: "Status", value: TASK_STATUS_LABELS[status] },
          { label: "Details", value: task.detailsMarkdown.trim() ? "Added" : "None" },
        ]}
      />
      {editing ? (
        <PageSection
          title="Update task details"
          description="Keep the task easy to scan and add extra context only where it helps execution."
          contentStyle={styles.sectionContent}
          footer={
            <>
              <AppButton
                title="Cancel"
                variant="outline"
                fullWidth
                onPress={() => {
                  setEditing(false)
                  setTitle(task.title)
                  setDetails(task.detailsMarkdown)
                  setStatus(task.status)
                }}
              />
              <AppButton
                title="Save"
                loading={save.isPending}
                onPress={() => save.mutate()}
                fullWidth
              />
            </>
          }
          footerStyle={styles.footer}
        >
          <PageField label="Title" description="Keep it short enough to scan in the task list.">
            <AppTextInput value={title} onChangeText={setTitle} maxLength={200} />
          </PageField>
          <PageField label="Status" description="Choose where this task belongs right now.">
            <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </PageField>
          <PageField label="Details" description="Use markdown for context, steps, or notes.">
            <AppTextInput
              multiline
              value={details}
              onChangeText={setDetails}
              style={styles.editor}
            />
          </PageField>
        </PageSection>
      ) : (
        <PageSection
          title="Task details"
          description={TASK_STATUS_LABELS[task.status]}
          contentStyle={styles.sectionContent}
          footer={
            <>
              <AppButton
                title="Delete"
                variant="danger"
                fullWidth
                onPress={handleDelete}
                loading={remove.isPending}
              />
              <AppButton
                title="Edit"
                variant="outline"
                fullWidth
                onPress={() => setEditing(true)}
              />
            </>
          }
          footerStyle={styles.footer}
        >
          <PageField
            label="Quick status"
            description="Switch columns without opening edit mode."
          >
            <Segmented
              options={STATUS_OPTIONS}
              value={status}
              onChange={(next) => {
                if (setTaskStatus.isPending) return
                setStatus(next)
                setTaskStatus.mutate(next)
              }}
            />
          </PageField>

          {task.detailsMarkdown ? (
            <MarkdownView markdown={task.detailsMarkdown} />
          ) : (
            <Text variant="muted" selectable>
              No details yet.
            </Text>
          )}
        </PageSection>
      )}
    </PageScrollView>
  )
}

const styles = StyleSheet.create({
  errorCard: {
    minHeight: 220,
  },
  sectionContent: { gap: Spacing.lg },
  footer: {
    flexDirection: "column",
    gap: Spacing.sm,
  },
  editor: {
    minHeight: 240,
  },
})
