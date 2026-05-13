import type { Task } from "@/lib/types"

export type TaskSection = { title: string; data: Task[] }

function dayStamp(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function groupTasksIntoSections(tasks: Task[], search: string): TaskSection[] {
  const q = search.trim().toLowerCase()
  const filtered = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.detailsMarkdown ?? "").toLowerCase().includes(q)
      )
    : tasks

  const todayKey = dayStamp(Math.floor(Date.now() / 1000))

  const notDone = filtered.filter((t) => t.status !== "done")
  const done = filtered
    .filter((t) => t.status === "done")
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const today: Task[] = []
  const upcoming: Task[] = []
  const anytime: Task[] = []

  for (const t of notDone) {
    if (t.dueAt == null || t.dueAt === undefined) {
      anytime.push(t)
      continue
    }
    const dk = dayStamp(t.dueAt)
    if (dk <= todayKey) today.push(t)
    else upcoming.push(t)
  }

  const sortByDueThenTitle = (a: Task, b: Task) => {
    const ad = a.dueAt ?? 0
    const bd = b.dueAt ?? 0
    if (ad !== bd) return ad - bd
    return a.title.localeCompare(b.title)
  }
  today.sort(sortByDueThenTitle)
  upcoming.sort(sortByDueThenTitle)
  anytime.sort((a, b) => a.title.localeCompare(b.title))

  const sections: TaskSection[] = []
  if (today.length) sections.push({ title: "Today", data: today })
  if (upcoming.length) sections.push({ title: "Upcoming", data: upcoming })
  if (anytime.length) sections.push({ title: "Anytime", data: anytime })
  if (done.length) sections.push({ title: "Completed", data: done })
  return sections
}
