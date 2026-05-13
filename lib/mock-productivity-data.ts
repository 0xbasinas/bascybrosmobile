import type { Note, Task } from "@/lib/types"

const now = Math.floor(Date.now() / 1000)
const day = 86400

/** Rich sample tasks so list grouping (today / upcoming / anytime / done) is visible without a backend. */
export const MOCK_TASKS: Task[] = [
  {
    id: "mock-task-1",
    userId: "local",
    title: "Review weekly goals",
    detailsMarkdown: "Keep the list short and actionable.",
    status: "open",
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: now - day * 2,
    updatedAt: now - 3600,
    dueAt: now - 3600,
    priority: "high",
  },
  {
    id: "mock-task-2",
    userId: "local",
    title: "Morning walk",
    detailsMarkdown: "",
    status: "open",
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: now - day,
    updatedAt: now - 7200,
    dueAt: now + 2 * 3600,
    priority: "low",
  },
  {
    id: "mock-task-3",
    userId: "local",
    title: "Draft project outline",
    detailsMarkdown: "## Sections\n- Problem\n- Approach",
    status: "in_progress",
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: now - day * 3,
    updatedAt: now - 500,
    dueAt: now + day * 3,
    priority: "medium",
  },
  {
    id: "mock-task-4",
    userId: "local",
    title: "Read for twenty minutes",
    detailsMarkdown: "",
    status: "open",
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: now - day * 5,
    updatedAt: now - day,
    priority: "low",
  },
  {
    id: "mock-task-5",
    userId: "local",
    title: "Inbox zero",
    detailsMarkdown: "",
    status: "done",
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: now - day * 7,
    updatedAt: now - day * 2,
    dueAt: now - day * 4,
    priority: "medium",
  },
]

export const MOCK_NOTES: Note[] = [
  {
    id: "mock-note-1",
    userId: "local",
    title: "Ideas for the weekend",
    contentMarkdown:
      "Visit the coast early, bring a thermos of coffee, and leave phones in the car.",
    tags: "personal, rest",
    createdAt: now - day * 2,
    updatedAt: now - 3600,
    kind: "text",
  },
  {
    id: "mock-note-2",
    userId: "local",
    title: "Grocery run",
    contentMarkdown: "- [ ] oats\n- [ ] berries\n- [x] yogurt\n- [ ] leafy greens",
    tags: "home",
    createdAt: now - day,
    updatedAt: now - 200,
    kind: "checklist",
  },
  {
    id: "mock-note-3",
    userId: "local",
    title: "Meeting notes — design sync",
    contentMarkdown:
      "We aligned on spacing, type scale, and keeping chrome invisible until it is needed.",
    tags: "work, design",
    createdAt: now - day * 4,
    updatedAt: now - day * 3,
    kind: "text",
  },
]
