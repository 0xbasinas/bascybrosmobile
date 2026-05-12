import { useState } from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { TaskFields } from "@/components/tasks/task-fields"
import { PageScrollView, PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { type TaskStatus } from "@/lib/types"

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
      <PageSection
        title="Set up the task"
        description="Keep the title scannable and add supporting notes only where they help."
        footer={
          <AppButton
            title="Create task"
            size="lg"
            fullWidth
            loading={create.isPending}
            onPress={handleSave}
          />
        }
        footerStyle={{ flexDirection: "column" }}
      >
        <TaskFields
          title={title}
          details={details}
          status={status}
          onTitleChange={setTitle}
          onDetailsChange={setDetails}
          onStatusChange={setStatus}
        />
      </PageSection>
    </PageScrollView>
  )
}
