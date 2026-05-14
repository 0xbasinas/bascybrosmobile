import { Ionicons } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  type TextInput,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FilterChip } from "@/components/lists/filter-chip"
import { ListFab, LIST_FAB_CLEARANCE } from "@/components/lists/list-fab"
import { ListHero } from "@/components/lists/list-hero"
import { ListSearchBar } from "@/components/lists/list-search-bar"
import { TaskRow } from "@/components/tasks/task-row"
import { UserMenu } from "@/components/user-menu"
import { AppTextInput } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight"
import { groupTasksIntoSections } from "@/lib/task-grouping"
import { Spacing, usePalette } from "@/lib/theme"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/lib/types"

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
}

const TAB_BAR_OFFSET = 58
const DAY = 86400

export default function TasksListScreen() {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const listFocused = useIsFocused()
  const keyboardHeight = useKeyboardHeight()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()
  const composerInputRef = useRef<TextInput>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
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

  const tasksRaw = useMemo(() => query.data?.tasks ?? [], [query.data?.tasks])
  const tasksFiltered = useMemo(() => {
    if (!statusFilter) return tasksRaw
    return tasksRaw.filter((t) => t.status === statusFilter)
  }, [tasksRaw, statusFilter])

  const sections = useMemo(() => groupTasksIntoSections(tasksFiltered, search), [tasksFiltered, search])
  const flatCount = useMemo(() => sections.reduce((n, s) => n + s.data.length, 0), [sections])

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

  const kbPad = listFocused ? keyboardHeight : 0
  const bottomPad =
    (composerOpen
      ? TAB_BAR_OFFSET + Math.max(insets.bottom, Spacing.md) + Spacing.xl
      : LIST_FAB_CLEARANCE) + kbPad
  const showInitialLoading = query.isLoading && !query.data
  const showWarmEmpty =
    !query.isError && !showInitialLoading && tasksRaw.length === 0 && !search.trim()
  const showSearchEmpty =
    !showInitialLoading && flatCount === 0 && search.trim().length > 0
  const showStatusFilterEmpty =
    !showInitialLoading &&
    !query.isError &&
    tasksRaw.length > 0 &&
    flatCount === 0 &&
    !search.trim() &&
    statusFilter !== null

  const iosKeyboardOffset = TAB_BAR_OFFSET + Math.max(insets.top, Spacing.sm) + Spacing.lg

  const renderTasksHeader = useCallback(
    () => (
      <View style={styles.headerBlock}>
        <ListHero eyebrow="Focus" title="Tasks" />
        <ListSearchBar
          containerClassName="mb-3"
          placeholder="Search tasks"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search tasks"
        />
        <View style={styles.filterBlock}>
          <Text variant="small" className="text-muted-foreground uppercase tracking-widest">
            Filter by status
          </Text>
          <View style={styles.chipRow}>
            <FilterChip
              label="All tasks"
              selected={statusFilter === null}
              onPress={() => setStatusFilter(null)}
              accessibilityLabel="Show all tasks"
            />
            {TASK_STATUSES.map((s) => (
              <FilterChip
                key={s}
                label={TASK_STATUS_LABELS[s]}
                selected={statusFilter === s}
                onPress={() => setStatusFilter(statusFilter === s ? null : s)}
                accessibilityLabel={`Filter by ${TASK_STATUS_LABELS[s]}`}
              />
            ))}
          </View>
        </View>
      </View>
    ),
    [search, statusFilter],
  )

  const tasksListEmpty = useMemo(() => {
    if (flatCount > 0) return null
    if (showSearchEmpty) {
      return (
        <View style={styles.emptyInList}>
          <EmptyState
            title="No matches"
            description="Try a shorter phrase or clear the search field."
          />
        </View>
      )
    }
    if (showStatusFilterEmpty) {
      return (
        <View style={styles.emptyInList}>
          <EmptyState
            title="Nothing in this status"
            description="Choose another status or show all tasks."
          />
        </View>
      )
    }
    if (showWarmEmpty) {
      return (
        <View style={styles.emptyInList}>
          <EmptyState
            title="A clear list"
            description="Add what matters for today. Tap the round add button to capture a task quickly."
          />
        </View>
      )
    }
    return null
  }, [flatCount, showSearchEmpty, showStatusFilterEmpty, showWarmEmpty])

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={iosKeyboardOffset}
    >
      <View
        className="flex-row items-center justify-end px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top, Spacing.sm) }}
      >
        <UserMenu />
      </View>

      {query.isError ? (
        <View style={styles.centerBlock}>
          <EmptyState title="Couldn't load tasks" description={query.error.message} />
        </View>
      ) : showInitialLoading ? (
        <View style={styles.centerBlock}>
          <LoadingState label="Loading tasks..." />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          style={styles.flexList}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={renderTasksHeader}
          ListEmptyComponent={tasksListEmpty}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View className="pb-2 pt-6">
              <Text variant="small" className="text-muted-foreground uppercase tracking-widest">
                {title}
              </Text>
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

      {composerOpen ? (
        <Card
          className="flex-row items-center gap-1 rounded-none rounded-t-2xl border-x-0 border-b-0 border-t border-border bg-card py-2 pl-1 pr-2 shadow-lg"
          style={{
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onPress={() => {
              setComposerOpen(false)
              setDraft("")
              Keyboard.dismiss()
            }}
            accessibilityLabel="Close quick add"
          >
            <Ionicons name="chevron-down" size={22} color={palette.textMuted} />
          </Button>
          <AppTextInput
            ref={composerInputRef}
            placeholder="New task"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              if (draft.trim() && !quickCreate.isPending) quickCreate.mutate()
            }}
            returnKeyType="done"
            autoFocus
            accessibilityLabel="Quick add task title"
            className="min-h-11 flex-1 border-0 bg-transparent px-1 shadow-none dark:bg-transparent"
          />
          <Button
            variant="ghost"
            size="icon"
            onPress={() => {
              if (draft.trim() && !quickCreate.isPending) quickCreate.mutate()
            }}
            disabled={!draft.trim() || quickCreate.isPending}
            accessibilityLabel="Save quick task"
          >
            {quickCreate.isPending ? (
              <ActivityIndicator color={palette.text} />
            ) : (
              <Ionicons name="send" size={24} color={palette.primary} />
            )}
          </Button>
        </Card>
      ) : null}

      {!composerOpen && !query.isError && !showInitialLoading ? (
        <ListFab
          useKeyboardInset={listFocused}
          onPress={() => {
            setComposerOpen(true)
            setTimeout(() => composerInputRef.current?.focus(), 60)
          }}
          accessibilityLabel="Add task"
        />
      ) : null}
    </KeyboardAvoidingView>
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
    paddingTop: Spacing.xs,
  },
  emptyInList: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
    minHeight: 220,
    justifyContent: "center",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    maxWidth: 420,
    alignSelf: "center",
  },
})
