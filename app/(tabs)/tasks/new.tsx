import { useHeaderHeight } from "@react-navigation/elements"
import { useState } from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { TaskFields } from "@/components/tasks/task-fields"
import { FormKeyboardSafeScroll } from "@/components/ui/form-keyboard-safe-scroll"
import { PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { Spacing } from "@/lib/theme"
import { type TaskStatus } from "@/lib/types"

export default function NewTaskScreen() {
  const headerHeight = useHeaderHeight()
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
    onError: (err) => Alert.alert("Couldn't save task", err.message),
  })

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Add a short title so you can find this task later.")
      return
    }
    create.mutate()
  }

  return (
    <FormKeyboardSafeScroll headerHeight={headerHeight}>
      <PageSection
        title="New task"
        description="Name it clearly, set where it sits, and add notes only if they help you execute."
      >
        <TaskFields
          title={title}
          details={details}
          status={status}
          onTitleChange={setTitle}
          onDetailsChange={setDetails}
          onStatusChange={setStatus}
          titleDescription="Keep it short enough to scan in your list."
          statusDescription="Open, In Progress, or Done — you can change this anytime."
          detailsDescription="Optional markdown for context, links, or checklists."
          detailsPlaceholder="Optional details..."
          detailsMinHeight={320}
        />
      </PageSection>
      <AppButton
        title="Save task"
        size="lg"
        fullWidth
        loading={create.isPending}
        onPress={handleSave}
        style={{ marginTop: Spacing.lg }}
      />
    </FormKeyboardSafeScroll>
  )
}
