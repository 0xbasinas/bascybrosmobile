import { useMemo, useState } from "react"
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
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

export default function NotesListScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { requestJson } = useApi()
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState<string | null>(null)

  const query = useQuery<{ ok: boolean; notes: Note[] }, HttpError>({
    queryKey: ["notes", { search, tag }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search.trim())
      if (tag) params.set("tag", tag)
      const qs = params.toString()
      return requestJson(`/api/mobile/notes${qs ? `?${qs}` : ""}`)
    },
  })

  const notes = useMemo(() => query.data?.notes ?? [], [query.data?.notes])
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const note of notes) {
      for (const t of splitTags(note.tags)) set.add(t)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [notes])

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.pagePadding}>
        <PageSection
          title="Your notes"
          description="Search, filter by tag, and jump back into your latest research."
          contentStyle={styles.toolbarSection}
        >
          <View style={styles.toolbar}>
            <AppTextInput
              placeholder="Search notes..."
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.flex}
            />
            <AppButton
              title="New"
              size="md"
              onPress={() => router.push("/(tabs)/notes/new")}
            />
          </View>

          {allTags.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagRow}
            >
              <TagChip
                label="All"
                active={tag === null}
                onPress={() => setTag(null)}
              />
              {allTags.map((t) => (
                <TagChip
                  key={t}
                  label={t}
                  active={tag === t}
                  onPress={() => setTag(tag === t ? null : t)}
                />
              ))}
            </ScrollView>
          ) : null}
        </PageSection>
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <LoadingState label="Loading notes..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load notes" description={query.error.message} />
          </PageSection>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="No notes yet" description="Tap New to write your first note." />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          ListHeaderComponent={
            <PageSection
              title={`${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
              description={
                tag
                  ? `Showing results tagged ${tag}.`
                  : "Showing your full note archive."
              }
              contentStyle={styles.summaryContent}
            >
              <Text variant="muted" selectable>
                Pull down anytime to refresh your latest notes.
              </Text>
            </PageSection>
          }
          renderItem={({ item }) => <NoteRow note={item} />}
        />
      )}
    </View>
  )
}

function TagChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const palette = usePalette()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: palette.border,
          backgroundColor: active ? palette.primary : palette.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: active ? palette.primaryText : palette.text,
          fontSize: FontSize.sm,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function NoteRow({ note }: { note: Note }) {
  const palette = usePalette()
  const tags = splitTags(note.tags)
  const preview = note.contentMarkdown.replace(/[#*`_>-]/g, "").trim()

  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <PageSection contentStyle={styles.rowContent}>
          <View style={styles.rowHeader}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
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
  container: { flex: 1, paddingTop: Spacing.sm },
  pagePadding: {
    paddingHorizontal: Spacing.lg,
  },
  toolbarSection: {
    gap: Spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  flex: { flex: 1 },
  tagRow: {
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  state: { flex: 1, paddingHorizontal: Spacing.lg },
  stateFill: { flex: 1 },
  stateCard: { minHeight: 220 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  summaryContent: {
    gap: Spacing.xs,
  },
  rowContent: {
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaTagText: {
    flex: 1,
  },
})
