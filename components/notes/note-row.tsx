import { Link } from "expo-router"
import { Pressable, StyleSheet, Text, View, Platform } from "react-native"

import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { Note, NoteKind } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function inferKind(note: Note): NoteKind {
  if (note.kind) return note.kind
  return /-\s*\[[ xX]\]/.test(note.contentMarkdown) ? "checklist" : "text"
}

function stripMarkdown(value: string): string {
  return value.replace(/[#*`_>\[\]-]/g, " ").replace(/\s+/g, " ").trim()
}

function previewLine(note: Note): string {
  const raw = stripMarkdown(note.contentMarkdown)
  if (!raw) return ""
  const first = raw.split("\n").map((l) => l.trim()).find(Boolean)
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
  const palette = usePalette()
  const tags = splitTags(note.tags)
  const snippet = previewLine(note)
  const kind = inferKind(note)
  const dateStr = formatUpdated(note.updatedAt)
  const tagStr = tags.map((t) => `#${t}`).join(" · ")
  const metaLine = tagStr ? `${dateStr} · ${tagStr}` : dateStr

  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: palette.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View
          style={[
            styles.accent,
            {
              backgroundColor: kind === "checklist" ? palette.textMuted : palette.border,
            },
          ]}
          accessibilityLabel={kind === "checklist" ? "Checklist note" : "Text note"}
        />
        <View style={styles.body}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
            {note.title}
          </Text>
          <Text style={[styles.snippet, { color: palette.textMuted }]} numberOfLines={2}>
            {snippet || "No preview yet"}
          </Text>
          <Text style={[styles.meta, { color: palette.textMuted }]} numberOfLines={1}>
            {metaLine}
          </Text>
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: Spacing.md,
    paddingRight: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accent: {
    width: 3,
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 2,
    marginRight: Spacing.md,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
    lineHeight: FontSize.md * 1.25,
  },
  snippet: {
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
    fontWeight: "400",
  },
  meta: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.15,
    marginTop: 2,
  },
})
