import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty"
import { Segmented } from "@/components/ui/segmented"
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
  { value: "in_progress", label: "In progress" },
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
      <View style={styles.toolbar}>
        <AppTextInput
          placeholder="Search tasks..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <AppButton
          title="New"
          size="md"
          onPress={() => router.push("/(tabs)/tasks/new")}
        />
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </View>

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : query.error ? (
        <EmptyState title="Couldn't load tasks" description={query.error.message} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks"
          description="Tap New to create your first task."
        />
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
            filter === "all" ? (
              <View style={{ paddingBottom: Spacing.md }}>
                <Text style={{ color: palette.textMuted, fontSize: FontSize.xs }}>
                  {grouped.open.length} open · {grouped.in_progress.length} in progress ·{" "}
                  {grouped.done.length} done
                </Text>
              </View>
            ) : null
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
  const palette = usePalette()
  const isDone = task.status === "done"

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
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
          <ActivityIndicator size="small" color={isDone ? palette.primaryText : palette.text} />
        ) : isDone ? (
          <Ionicons name="checkmark" size={16} color={palette.primaryText} />
        ) : task.status === "in_progress" ? (
          <Ionicons name="ellipse" size={10} color={palette.text} />
        ) : null}
      </Pressable>

      <Link
        href={{ pathname: "/(tabs)/tasks/[id]", params: { id: task.id } }}
        asChild
      >
        <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
          <Text
            style={{
              color: palette.text,
              fontSize: FontSize.md,
              fontWeight: "500",
              textDecorationLine: isDone ? "line-through" : "none",
            }}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <Text
            style={{ color: palette.textMuted, fontSize: FontSize.xs, marginTop: 4 }}
          >
            {TASK_STATUS_LABELS[task.status]}
          </Text>
        </Pressable>
      </Link>

      <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
    </View>
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
  statusButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
})
