import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty"
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
      <View style={styles.toolbar}>
        <AppTextInput
          placeholder="Search notes..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
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

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : query.error ? (
        <EmptyState
          title="Couldn't load notes"
          description={query.error.message}
        />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Tap New to write your first note."
        />
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
  return (
    <Link href={{ pathname: "/(tabs)/notes/[id]", params: { id: note.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.text, fontSize: FontSize.md, fontWeight: "600" }} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: FontSize.sm, marginTop: 2 }} numberOfLines={2}>
            {note.contentMarkdown.replace(/[#*`_>-]/g, "").trim()}
          </Text>
          <View style={styles.metaRow}>
            <Text style={{ color: palette.textMuted, fontSize: FontSize.xs }}>
              {formatDate(note.updatedAt)}
            </Text>
            {tags.length > 0 ? (
              <Text style={{ color: palette.textMuted, fontSize: FontSize.xs }} numberOfLines={1}>
                {" · "}
                {tags.join(", ")}
              </Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.md },
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    alignItems: "center",
  },
  tagRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: Spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: "row", marginTop: 6, alignItems: "center" },
})
