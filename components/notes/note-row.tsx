import { Ionicons } from "@expo/vector-icons"
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

  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: palette.border, opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <View style={styles.iconCol}>
          <View style={[styles.kindIcon, { backgroundColor: palette.surfaceMuted }]}>
            <Ionicons
              name={kind === "checklist" ? "checkbox-outline" : "document-text-outline"}
              size={18}
              color={palette.textMuted}
            />
          </View>
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
            {note.title}
          </Text>
          {snippet ? (
            <Text style={[styles.snippet, { color: palette.textMuted }]} numberOfLines={2}>
              {snippet}
            </Text>
          ) : (
            <Text style={[styles.snippet, { color: palette.textMuted }]} numberOfLines={1}>
              No body yet
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {formatUpdated(note.updatedAt)}
            </Text>
            {tags.length > 0 ? (
              <Text style={[styles.meta, { color: palette.textMuted }]} numberOfLines={1}>
                {" · "}
                {tags.join(" · ")}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  iconCol: {
    paddingRight: Spacing.md,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  kindIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -0.35 : 0,
  },
  snippet: {
    marginTop: 6,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.45,
    fontWeight: "400",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
})
