import { Link } from "expo-router"
import { Pressable, View } from "react-native"

import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function stripMarkdown(value: string): string {
  return value.replace(/[#*`_>\[\]-]/g, " ").replace(/\s+/g, " ").trim()
}

function previewLine(note: Note): string {
  const raw = stripMarkdown(note.contentMarkdown)
  if (!raw) return ""
  const first = raw
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean)
  return first ?? ""
}

function formatUpdated(unix: number): string {
  const d = new Date(unix * 1000)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function NoteRow({ note }: { note: Note }) {
  const tags = splitTags(note.tags)
  const snippet = previewLine(note)
  const dateStr = formatUpdated(note.updatedAt)
  const tagStr = tags.map((t) => `#${t}`).join(" · ")
  const metaLine = tagStr ? `${dateStr} · ${tagStr}` : dateStr

  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable className="active:opacity-90">
        <Card className="mb-3 flex-col gap-2 overflow-hidden px-4 pb-5 pt-5 shadow-sm shadow-black/5">
          <Text className="text-base font-semibold leading-snug" numberOfLines={2}>
            {note.title}
          </Text>
          <Text variant="muted" numberOfLines={2}>
            {snippet || "No preview yet"}
          </Text>
          <Text variant="muted" className="text-xs font-medium tracking-wide" numberOfLines={1}>
            {metaLine}
          </Text>
        </Card>
      </Pressable>
    </Link>
  )
}
