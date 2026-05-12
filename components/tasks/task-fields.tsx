import { StyleSheet } from "react-native"

import { AppTextInput } from "@/components/ui/input"
import { PageField } from "@/components/ui/page"
import { Segmented } from "@/components/ui/segmented"
import { Spacing } from "@/lib/theme"
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/types"

const STATUS_OPTIONS = TASK_STATUSES.map((status) => ({
  value: status,
  label: status === "in_progress" ? "Progress" : TASK_STATUS_LABELS[status],
}))

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
        <Segmented options={STATUS_OPTIONS} value={status} onChange={onStatusChange} />
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

export { STATUS_OPTIONS }

const styles = StyleSheet.create({
  editor: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
})
