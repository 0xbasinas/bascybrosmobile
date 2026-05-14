import { useIsFocused } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FilterChip } from "@/components/lists/filter-chip"
import { ListFab, LIST_FAB_CLEARANCE } from "@/components/lists/list-fab"
import { ListHero } from "@/components/lists/list-hero"
import { ListSearchBar } from "@/components/lists/list-search-bar"
import { NoteRow } from "@/components/notes/note-row"
import { UserMenu } from "@/components/user-menu"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight"
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
  const insets = useSafeAreaInsets()
  const listFocused = useIsFocused()
  const keyboardHeight = useKeyboardHeight()
  const router = useRouter()
  const { requestJson } = useApi()
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState<string | null>(null)

  const notesQueryKey = useMemo(() => ["notes", { search, tag }] as const, [search, tag])

  const query = useQuery<{ ok: boolean; notes: Note[] }, HttpError>({
    queryKey: notesQueryKey,
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

  const filteredLocal = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return notes
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.contentMarkdown.toLowerCase().includes(q) ||
        splitTags(n.tags).some((t) => t.toLowerCase().includes(q)),
    )
  }, [notes, search])

  const bottomPad = LIST_FAB_CLEARANCE + (listFocused ? keyboardHeight : 0)

  const showInitialLoading = query.isLoading && !query.data

  const renderListHeader = useCallback(
    () => (
      <View style={styles.headerBlock}>
        <ListHero eyebrow="Library" title="Notes" />
        <ListSearchBar
          containerClassName="mb-4"
          placeholder="Search titles, body, or tags"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search notes"
        />
        {allTags.length > 0 ? (
          <View style={styles.filterBlock}>
            <Text variant="small" className="text-muted-foreground uppercase tracking-widest">
              Filter by tag
            </Text>
            <View style={styles.chipRow}>
              <FilterChip
                label="All notes"
                selected={tag === null}
                onPress={() => setTag(null)}
                accessibilityLabel="Show all notes"
              />
              {allTags.map((t) => (
                <FilterChip
                  key={t}
                  label={`#${t}`}
                  selected={tag === t}
                  onPress={() => setTag(tag === t ? null : t)}
                  accessibilityLabel={`Filter by tag ${t}`}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    ),
    [search, tag, allTags],
  )

  const listEmpty = useMemo(() => {
    if (filteredLocal.length > 0) return null
    if (search.trim().length > 0) {
      return (
        <View style={styles.emptyInList}>
          <EmptyState
            title="Nothing for that search"
            description="Loosen the query or clear the field to see everything again."
          />
        </View>
      )
    }
    return (
      <View style={styles.emptyInList}>
        <EmptyState
          title="Your space"
          description="Capture a thought in a sentence or a page. Use the round add button in the lower-right corner."
        />
      </View>
    )
  }, [filteredLocal.length, search])

  return (
    <View className="flex-1" style={{ backgroundColor: palette.background }}>
      <View
        className="flex-row items-center justify-end px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top, Spacing.sm) }}
      >
        <UserMenu />
      </View>

      {query.isError ? (
        <View style={styles.centerBlock}>
          <EmptyState title="Couldn't load notes" description={query.error.message} />
        </View>
      ) : showInitialLoading ? (
        <View style={styles.centerBlock}>
          <LoadingState label="Loading notes..." />
        </View>
      ) : (
        <FlatList
          data={filteredLocal}
          keyExtractor={(item) => item.id}
          style={styles.flexList}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          renderItem={({ item }) => <NoteRow note={item} />}
        />
      )}

      {!query.isError && !showInitialLoading ? (
        <ListFab
          useKeyboardInset={listFocused}
          onPress={() => router.push("/(tabs)/notes/new")}
          accessibilityLabel="New note"
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  headerBlock: {
    paddingBottom: Spacing.xs,
  },
  filterBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  emptyInList: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
    minHeight: 200,
    justifyContent: "center",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    maxWidth: 420,
    alignSelf: "center",
  },
})
