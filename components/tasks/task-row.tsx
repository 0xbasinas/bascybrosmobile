import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"

import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import { TASK_STATUS_LABELS, type Task } from "@/lib/types"

export function TaskRow({
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
    <PageSection contentStyle={styles.content}>
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

        <Link href={{ pathname: "/(tabs)/tasks/[id]", params: { id: task.id } }} asChild>
          <Pressable style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}>
            <Text
              style={[
                styles.title,
                { textDecorationLine: isDone ? "line-through" : "none" },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Text variant="muted" selectable style={styles.meta}>
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
  content: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "500",
  },
  meta: {
    marginTop: 4,
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
})
