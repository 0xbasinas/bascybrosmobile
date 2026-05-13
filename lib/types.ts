export type NoteKind = "text" | "checklist"

export type Note = {
  id: string
  userId: string
  title: string
  contentMarkdown: string
  tags: string
  createdAt: number
  updatedAt: number
  /** Optional; used for list affordances. Can be inferred from markdown when absent. */
  kind?: NoteKind
}

export type TaskPriority = "low" | "medium" | "high"

export type Task = {
  id: string
  userId: string
  title: string
  detailsMarkdown: string
  status: "open" | "in_progress" | "done"
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: number
  updatedAt: number
  /** Optional due date (unix seconds). When omitted, the task is grouped as anytime. */
  dueAt?: number | null
  /** Optional priority hint for the list row. */
  priority?: TaskPriority | null
}

export type UploadedFile = {
  id: string
  userId: string
  filename: string
  storagePath: string
  url: string
  mimeType: string
  size: number
  entityType: string | null
  entityId: string | null
  createdAt: number
}

export type NewsItem = {
  source: string
  title: string
  link: string
  pubDate: string | null
  summary: string
}

export type AssistantChat = {
  id: string
  userId: string
  title: string
  createdAt: number
  updatedAt: number
}

export type AssistantMessage = {
  id: string
  chatId: string
  role: "user" | "assistant" | string
  contentMarkdown: string
  metadataJson: string | null
  createdAt: number
}

export const TASK_STATUSES = ["open", "in_progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
}
