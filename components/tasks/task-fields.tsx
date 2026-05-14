import { StyleSheet } from "react-native"

import { TaskStatusChips } from "@/components/tasks/task-status-chips"
import { AppTextInput } from "@/components/ui/input"
import { PageField } from "@/components/ui/page"
import { Spacing } from "@/lib/theme"
import type { TaskStatus } from "@/lib/types"

export function TaskFields({
  title,
  details,
  status,
  onTitleChange,
  onDetailsChange,
  onStatusChange,
  detailsPlaceholder = "Optional notes...",
  detailsMinHeight = 220,
  titleDescription = "A short summary of the work to do.",
  statusDescription = "Choose where this task belongs right now.",
  detailsDescription = "Optional markdown notes, context, or acceptance criteria.",
}: {
  title: string
  details: string
  status: TaskStatus
  onTitleChange: (value: string) => void
  onDetailsChange: (value: string) => void
  onStatusChange: (value: TaskStatus) => void
  detailsPlaceholder?: string
  detailsMinHeight?: number
  titleDescription?: string
  statusDescription?: string
  detailsDescription?: string
}) {
  return (
    <>
      <PageField label="Title" description={titleDescription}>
        <AppTextInput
          placeholder="Task title"
          value={title}
          onChangeText={onTitleChange}
          maxLength={200}
        />
      </PageField>

      <PageField label="Status" description={statusDescription}>
        <TaskStatusChips value={status} onChange={onStatusChange} />
      </PageField>

      <PageField label="Details" description={detailsDescription}>
        <AppTextInput
          multiline
          placeholder={detailsPlaceholder}
          value={details}
          onChangeText={onDetailsChange}
          style={[styles.editor, { minHeight: detailsMinHeight }]}
        />
      </PageField>
    </>
  )
}

const styles = StyleSheet.create({
  editor: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
})
