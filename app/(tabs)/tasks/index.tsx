import { useMemo, useState } from "react"
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Segmented } from "@/components/ui/segmented"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/lib/types"

type FilterValue = TaskStatus | "all"

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Prog." },
  { value: "done", label: "Done" },
]

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
}

export default function TasksListScreen() {
  const palette = usePalette()
  const router = useRouter()
  const { requestJson } = useApi()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<FilterValue>("all")
  const [search, setSearch] = useState("")

  const query = useQuery<{ ok: boolean; tasks: Task[] }, HttpError>({
    queryKey: ["tasks", { filter, search }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filter !== "all") params.set("status", filter)
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

  const tasks = useMemo(() => query.data?.tasks ?? [], [query.data?.tasks])
  const grouped = useMemo(() => {
    const out: Record<TaskStatus, Task[]> = { open: [], in_progress: [], done: [] }
    for (const t of tasks) out[t.status].push(t)
    return out
  }, [tasks])

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.pagePadding}>
        <PageSection
          title="Task board"
          description="Search your tasks, change views, and keep active work moving."
          contentStyle={styles.toolbarSection}
        >
          <View style={styles.toolbar}>
            <AppTextInput
              placeholder="Search tasks..."
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
              onPress={() => router.push("/(tabs)/tasks/new")}
            />
          </View>

          <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </PageSection>
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <LoadingState label="Loading tasks..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load tasks" description={query.error.message} />
          </PageSection>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="No tasks" description="Tap New to create your first task." />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={tasks}
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
              title={filter === "all" ? "Overview" : `Filtered: ${FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? "Tasks"}`}
              description={
                filter === "all"
                  ? `${grouped.open.length} open, ${grouped.in_progress.length} in progress, ${grouped.done.length} done.`
                  : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} in this view.`
              }
              contentStyle={styles.summaryContent}
            >
              <Text variant="muted" selectable>
                Tap a task to open it, or use the status circle to cycle it forward.
              </Text>
            </PageSection>
          }
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              busy={setStatus.isPending && setStatus.variables?.id === item.id}
              onCycle={() =>
                setStatus.mutate({ id: item.id, status: NEXT_STATUS[item.status] })
              }
            />
          )}
        />
      )}
    </View>
  )
}

function TaskRow({
  task,
  busy,
  onCycle,
}: {
  task: Task
  busy: boolean
  onCycle: () => void
}) {
  const isDone = task.status === "done"
  const palette = usePalette()

  return (
    <PageSection contentStyle={styles.rowContent}>
      <View style={styles.row}>
        <Pressable
          onPress={onCycle}
          disabled={busy}
          hitSlop={8}
          style={({ pressed }) => [
            styles.statusButton,
            {
              borderColor: palette.border,
              backgroundColor: isDone ? palette.primary : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {busy ? (
            <LoadingState />
          ) : isDone ? (
            <Ionicons name="checkmark" size={16} color={palette.primaryText} />
          ) : task.status === "in_progress" ? (
            <Ionicons name="ellipse" size={10} color={palette.text} />
          ) : task.status === "open" ? (
            <Ionicons name="ellipse-outline" size={16} color={palette.textMuted} />
          ) : null}
        </Pressable>

        <Link
          href={{ pathname: "/(tabs)/tasks/[id]", params: { id: task.id } }}
          asChild
        >
          <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}>
            <Text
              style={[
                styles.rowTitle,
                { textDecorationLine: isDone ? "line-through" : "none" },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Text variant="muted" selectable style={styles.rowMeta}>
              {TASK_STATUS_LABELS[task.status]}
            </Text>
          </Pressable>
        </Link>

        <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
      </View>
    </PageSection>
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
    padding: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: "500",
  },
  rowMeta: {
    marginTop: 4,
  },
  statusButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
})
