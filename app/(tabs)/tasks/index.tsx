import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TaskRow } from "@/components/tasks/task-row"
import { UserMenu } from "@/components/user-menu"
import { LoadingState } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { groupTasksIntoSections } from "@/lib/task-grouping"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import { type Task, type TaskStatus } from "@/lib/types"

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
}

const TAB_BAR_OFFSET = 58
const TOUCH = 44
const DAY = 86400

export default function TasksListScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()
  const composerInputRef = useRef<TextInput>(null)

  const [search, setSearch] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState("")

  const tasksQueryKey = useMemo(() => ["tasks", { search }] as const, [search])

  const query = useQuery<{ ok: boolean; tasks: Task[] }, HttpError>({
    queryKey: tasksQueryKey,
    queryFn: () => {
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search.trim())
      const qs = params.toString()
      return requestJson(`/api/mobile/tasks${qs ? `?${qs}` : ""}`)
    },
  })

  const setStatus = useMutation<unknown, HttpError, { id: string; status: TaskStatus }>({
    mutationFn: ({ id, status }) =>
      requestJson(`/api/mobile/tasks/${id}/status`, {
        method: "POST",
        body: { status },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  const deleteTask = useMutation<unknown, HttpError, string>({
    mutationFn: (id) => requestJson(`/api/mobile/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  const quickCreate = useMutation<unknown, HttpError, void>({
    mutationFn: () =>
      requestJson("/api/mobile/tasks", {
        method: "POST",
        body: {
          title: draft.trim(),
          detailsMarkdown: "",
          status: "open" as TaskStatus,
        },
      }),
    onSuccess: () => {
      setDraft("")
      setComposerOpen(false)
      Keyboard.dismiss()
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const tasks = useMemo(() => query.data?.tasks ?? [], [query.data?.tasks])
  const sections = useMemo(() => groupTasksIntoSections(tasks, search), [tasks, search])
  const flatCount = useMemo(
    () => sections.reduce((n, s) => n + s.data.length, 0),
    [sections]
  )

  function snoozeInCache(taskId: string) {
    queryClient.setQueryData<{ ok: boolean; tasks: Task[] }>(tasksQueryKey, (old) => {
      if (!old?.tasks) return old
      const now = Math.floor(Date.now() / 1000)
      return {
        ...old,
        tasks: old.tasks.map((t) => {
          if (t.id !== taskId) return t
          const from = t.dueAt ?? now
          return { ...t, dueAt: from + DAY }
        }),
      }
    })
  }

  const bottomPad = TAB_BAR_OFFSET + Math.max(insets.bottom, Spacing.md) + Spacing.xl
  const showInitialLoading = query.isLoading && !query.data
  const showWarmEmpty = !query.isError && !showInitialLoading && flatCount === 0 && !search.trim()
  const showSearchEmpty =
    !showInitialLoading && flatCount === 0 && search.trim().length > 0

  const iosKeyboardOffset = TAB_BAR_OFFSET + Math.max(insets.top, Spacing.sm) + Spacing.lg

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={iosKeyboardOffset}
    >
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Spacing.sm),
          },
        ]}
      >
        <Pressable
          onPress={() => {
            setComposerOpen(true)
            setTimeout(() => composerInputRef.current?.focus(), 60)
          }}
          style={({ pressed }) => [
            styles.headerIconButton,
            { opacity: pressed ? 0.65 : 1, minWidth: TOUCH, minHeight: TOUCH },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add task"
        >
          <Ionicons name="add" size={28} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <UserMenu />
      </View>

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>Focus</Text>
        <Text style={[styles.screenTitle, { color: palette.text }]}>Tasks</Text>
        <View
          style={[
            styles.searchRow,
            { borderBottomColor: palette.border },
          ]}
        >
          <Ionicons name="search" size={18} color={palette.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={palette.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.searchInput, { color: palette.text }]}
            accessibilityLabel="Search tasks"
          />
        </View>
      </View>

      <View style={styles.body}>
        {query.isError ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Couldn’t load tasks</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              {query.error.message}
            </Text>
          </View>
        ) : showInitialLoading ? (
          <View style={styles.centerBlock}>
            <LoadingState label="Loading tasks..." />
          </View>
        ) : showWarmEmpty ? (
          <View style={[styles.centerBlock, { paddingHorizontal: Spacing.xl }]}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>A clear list</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Add what matters for today. Everything else can wait in the wings.
            </Text>
          </View>
        ) : showSearchEmpty ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No matches</Text>
            <Text style={[styles.emptyBody, { color: palette.textMuted }]}>
              Try a shorter phrase or clear the search field.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            style={styles.flexList}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching && !query.isLoading}
                onRefresh={() => query.refetch()}
                tintColor={palette.text}
              />
            }
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TaskRow
                task={item}
                busy={setStatus.isPending && setStatus.variables?.id === item.id}
                onCycleStatus={() =>
                  setStatus.mutate({ id: item.id, status: NEXT_STATUS[item.status] })
                }
                onSwipeComplete={(next) => setStatus.mutate({ id: item.id, status: next })}
                onDelete={() => deleteTask.mutate(item.id)}
                onSnooze={() => snoozeInCache(item.id)}
              />
            )}
          />
        )}
      </View>

      {composerOpen ? (
        <View
          style={[
            styles.composer,
            {
              backgroundColor: palette.surface,
              borderTopColor: palette.border,
              paddingBottom: Math.max(insets.bottom, Spacing.sm),
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setComposerOpen(false)
              setDraft("")
              Keyboard.dismiss()
            }}
            style={styles.composerClose}
            accessibilityRole="button"
            accessibilityLabel="Close quick add"
          >
            <Ionicons name="chevron-down" size={24} color={palette.textMuted} />
          </Pressable>
          <TextInput
            ref={composerInputRef}
            placeholder="New task"
            placeholderTextColor={palette.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              if (draft.trim() && !quickCreate.isPending) quickCreate.mutate()
            }}
            returnKeyType="done"
            style={[styles.composerInput, { color: palette.text }]}
            autoFocus
            accessibilityLabel="Quick add task title"
          />
          <Pressable
            onPress={() => {
              if (draft.trim() && !quickCreate.isPending) quickCreate.mutate()
            }}
            disabled={!draft.trim() || quickCreate.isPending}
            style={({ pressed }) => [
              styles.composerSend,
              {
                opacity: !draft.trim() ? 0.35 : pressed ? 0.75 : 1,
                minWidth: TOUCH,
                minHeight: TOUCH,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save quick task"
          >
            {quickCreate.isPending ? (
              <ActivityIndicator color={palette.text} />
            ) : (
              <Ionicons name="arrow-up-circle" size={32} color={palette.text} />
            )}
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
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
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionHeader: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
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
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  composerClose: {
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    fontSize: FontSize.md,
    minHeight: TOUCH,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  composerSend: {
    alignItems: "center",
    justifyContent: "center",
  },
})
