import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"

import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatDate(unix: number) {
  const date = new Date(unix * 1000)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function NoteRow({ note }: { note: Note }) {
  const palette = usePalette()
  const tags = splitTags(note.tags)
  const preview = note.contentMarkdown.replace(/[#*`_>-]/g, "").trim()

  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <PageSection contentStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.textWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {note.title}
              </Text>
              {preview ? (
                <Text variant="muted" numberOfLines={2} selectable>
                  {preview}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </View>
          <View style={styles.metaRow}>
            <Text variant="muted" selectable>
              {formatDate(note.updatedAt)}
            </Text>
            {tags.length > 0 ? (
              <Text variant="muted" numberOfLines={1} selectable style={styles.metaTagText}>
                {tags.join(" · ")}
              </Text>
            ) : null}
          </View>
        </PageSection>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  metaTagText: {
    flex: 1,
  },
})
