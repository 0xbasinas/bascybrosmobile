import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NoteRow } from "@/components/notes/note-row"
import { UserMenu } from "@/components/user-menu"
import { LoadingState } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette, type ThemePalette } from "@/lib/theme"
import type { Note } from "@/lib/types"

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

const TOUCH = 44
const TAB_BAR_OFFSET = 58

/**
 * Single-column list: previews stay readable and tap targets stay large on phone widths.
 */
export default function NotesListScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
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
        splitTags(n.tags).some((t) => t.toLowerCase().includes(q))
    )
  }, [notes, search])

  const bottomPad = TAB_BAR_OFFSET + Math.max(insets.bottom, Spacing.md) + Spacing.xl

  const showInitialLoading = query.isLoading && !query.data
  const showWarmEmpty =
    !query.isError && !showInitialLoading && filteredLocal.length === 0 && !search.trim()
  const showSearchEmpty =
    !showInitialLoading && filteredLocal.length === 0 && search.trim().length > 0

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Spacing.sm),
          },
        ]}
      >
        <Pressable
          onPress={() => router.push("/(tabs)/notes/new")}
          style={({ pressed }) => [
            styles.headerIconButton,
            { opacity: pressed ? 0.65 : 1, minWidth: TOUCH, minHeight: TOUCH },
          ]}
          accessibilityRole="button"
          accessibilityLabel="New note"
        >
          <Ionicons name="add" size={28} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <UserMenu />
      </View>

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>Library</Text>
        <Text style={[styles.screenTitle, { color: palette.text }]}>Notes</Text>

        <View style={[styles.searchRow, { borderBottomColor: palette.border }]}>
          <Ionicons name="search" size={17} color={palette.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={palette.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.searchInput, { color: palette.text }]}
            accessibilityLabel="Search notes"
          />
        </View>

        {allTags.length > 0 ? (
          <View style={styles.tagSection}>
            <Text style={[styles.tagSectionLabel, { color: palette.textMuted }]}>Filter by tag</Text>
            <View style={styles.tagWrap}>
              <TagChip
                display="All notes"
                value={null}
                selected={tag === null}
                onSelect={() => setTag(null)}
                palette={palette}
              />
              {allTags.map((t) => (
                <TagChip
                  key={t}
                  display={`#${t}`}
                  value={t}
                  selected={tag === t}
                  onSelect={() => setTag(tag === t ? null : t)}
                  palette={palette}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {query.isError ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Couldn’t load notes</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              {query.error.message}
            </Text>
          </View>
        ) : showInitialLoading ? (
          <View style={styles.centerBlock}>
            <LoadingState label="Loading notes..." />
          </View>
        ) : showWarmEmpty ? (
          <View style={[styles.centerBlock, { paddingHorizontal: Spacing.xl }]}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Your space</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Capture a thought in a sentence or a page. Tap the plus when you are ready.
            </Text>
          </View>
        ) : showSearchEmpty ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Nothing for that search</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Loosen the query or clear the field to see everything again.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredLocal}
            keyExtractor={(item) => item.id}
            style={styles.flexList}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching && !query.isLoading}
                onRefresh={() => query.refetch()}
                tintColor={palette.text}
              />
            }
            ListHeaderComponent={
              <Pressable
                onPress={() => router.push("/(tabs)/notes/new")}
                style={({ pressed }) => [
                  styles.newNoteRow,
                  { borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create new note"
              >
                <Ionicons name="create-outline" size={20} color={palette.textMuted} />
                <Text style={[styles.newNoteLabel, { color: palette.text }]}>New note</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
              </Pressable>
            }
            renderItem={({ item }) => <NoteRow note={item} />}
          />
        )}
      </View>
    </View>
  )
}

function TagChip({
  display,
  value,
  selected,
  onSelect,
  palette,
}: {
  display: string
  value: string | null
  selected: boolean
  onSelect: () => void
  palette: ThemePalette
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.tagChip,
        {
          borderColor: selected ? palette.text : palette.border,
          backgroundColor: selected ? palette.surfaceMuted : palette.background,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={value === null ? "Show all notes" : `Filter by tag ${value}`}
    >
      <Text
        style={[
          styles.tagChipText,
          {
            color: selected ? palette.text : palette.textMuted,
            fontWeight: selected ? "600" : "500",
          },
        ]}
        numberOfLines={1}
      >
        {display}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  flexList: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerIconButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -Spacing.xs,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: FontSize.title,
    fontWeight: "600",
    letterSpacing: Platform.OS === "ios" ? -0.8 : 0,
    marginBottom: Spacing.lg,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: TOUCH,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  tagSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tagSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tagChip: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  tagChipText: {
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  newNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 52,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
  },
  newNoteLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    maxWidth: 420,
    alignSelf: "center",
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.45,
    textAlign: "center",
  },
})
