import { useMemo, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"

import { NoteRow } from "@/components/notes/note-row"
import { NotesControls } from "@/components/notes/notes-controls"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { Spacing, usePalette } from "@/lib/theme"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
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
      <View style={styles.topPadding}>
        <NotesControls
          search={search}
          onSearchChange={setSearch}
          tags={allTags}
          selectedTag={tag}
          onSelectTag={setTag}
          onCreate={() => router.push("/(tabs)/notes/new")}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <LoadingState label="Loading notes..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.topPadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load notes" description={query.error.message} />
          </PageSection>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.topPadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="No notes yet" description="Tap New to write your first note." />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          renderItem={({ item }) => <NoteRow note={item} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  state: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  stateFill: { flex: 1 },
  stateCard: { minHeight: 220 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
})
