import { useMemo, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { TaskRow } from "@/components/tasks/task-row"
import { type FilterValue, TasksControls } from "@/components/tasks/tasks-controls"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { Spacing, usePalette } from "@/lib/theme"
import { type Task, type TaskStatus } from "@/lib/types"

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

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topPadding}>
        <TasksControls
          search={search}
          filter={filter}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onCreate={() => router.push("/(tabs)/tasks/new")}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <LoadingState label="Loading tasks..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.topPadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load tasks" description={query.error.message} />
          </PageSection>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.topPadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="No tasks" description="Tap New to create your first task." />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={tasks}
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
