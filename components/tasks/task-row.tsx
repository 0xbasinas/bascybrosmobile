import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { Link } from "expo-router"
import { useEffect, useRef } from "react"
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"

import { Card } from "@/components/ui/card"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { Task, TaskPriority, TaskStatus } from "@/lib/types"

const TOUCH = 44

function priorityGlyph(p: TaskPriority | null | undefined): string | null {
  if (!p) return null
  if (p === "high") return "H"
  if (p === "medium") return "M"
  return "L"
}

function formatDueShort(unix: number): string {
  const d = new Date(unix * 1000)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

export function TaskRow({
  task,
  busy,
  onCycleStatus,
  onSwipeComplete,
  onDelete,
  onSnooze,
}: {
  task: Task
  busy: boolean
  /** Checkbox: advance open → in progress → done. */
  onCycleStatus: () => void
  /** Leading swipe: mark done, or reopen when already done. */
  onSwipeComplete: (next: TaskStatus) => void
  onDelete: () => void
  onSnooze: () => void
}) {
  const palette = usePalette()
  const swipeRef = useRef<Swipeable | null>(null)
  const isDone = task.status === "done"
  const doneProgress = useSharedValue(isDone ? 1 : 0)
  const checkScale = useSharedValue(isDone ? 1 : 0.92)

  useEffect(() => {
    doneProgress.value = withTiming(isDone ? 1 : 0, { duration: 280 })
    checkScale.value = withSpring(isDone ? 1 : 0.92, { damping: 14, stiffness: 220 })
  }, [isDone, doneProgress, checkScale])

  const titleAnim = useAnimatedStyle(() => ({
    opacity: 0.42 + 0.58 * (1 - doneProgress.value),
  }))

  const boxAnim = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }))

  const pg = priorityGlyph(task.priority ?? null)
  const dueLine =
    task.dueAt != null && task.dueAt !== undefined ? formatDueShort(task.dueAt) : null

  function closeSwipe() {
    swipeRef.current?.close()
  }

  function handleDelete() {
    closeSwipe()
    Alert.alert("Delete task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          onDelete()
        },
      },
    ])
  }

  function handleSnooze() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSwipe()
    onSnooze()
  }

  function handleCheckboxPress() {
    if (busy) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onCycleStatus()
  }

  const leftBg = isDone ? palette.surfaceMuted : palette.success
  const leftIcon = isDone ? "arrow-undo" : "checkmark"
  const leftIconColor = isDone ? palette.text : palette.textInverse

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <View style={[styles.swipeSide, { backgroundColor: leftBg }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isDone ? "Mark not done" : "Mark done"}
            onPress={() => {
              closeSwipe()
              if (isDone) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onSwipeComplete("open")
              } else {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onSwipeComplete("done")
              }
            }}
            style={styles.swipePress}
          >
            <Ionicons name={leftIcon as never} size={22} color={leftIconColor} />
          </Pressable>
        </View>
      )}
      renderRightActions={() => (
        <View style={styles.swipeRightRow}>
          <View style={[styles.swipeSide, { backgroundColor: palette.surfaceMuted }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Snooze one day"
              onPress={handleSnooze}
              style={styles.swipePress}
            >
              <Ionicons name="moon-outline" size={20} color={palette.text} />
            </Pressable>
          </View>
          <View style={[styles.swipeSide, { backgroundColor: palette.danger }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete task"
              onPress={handleDelete}
              style={styles.swipePress}
            >
              <Ionicons name="trash-outline" size={20} color={palette.textInverse} />
            </Pressable>
          </View>
        </View>
      )}
    >
      <Card className="mb-2 flex-row items-stretch gap-0 overflow-hidden py-0 pl-0 pr-0 shadow-sm shadow-black/5">
        <Pressable
          onPress={handleCheckboxPress}
          disabled={busy}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone, disabled: busy }}
          style={styles.checkboxHit}
        >
          <Animated.View
            style={[
              styles.checkboxRing,
              {
                borderColor: isDone ? palette.primary : palette.border,
                backgroundColor: isDone ? palette.primary : "transparent",
              },
              boxAnim,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={palette.textMuted} />
            ) : isDone ? (
              <Ionicons name="checkmark" size={18} color={palette.primaryText} />
            ) : task.status === "in_progress" ? (
              <View style={[styles.dot, { backgroundColor: palette.text }]} />
            ) : (
              <View style={[styles.dotOutline, { borderColor: palette.textMuted }]} />
            )}
          </Animated.View>
        </Pressable>

        <Link href={{ pathname: "/(tabs)/tasks/[id]", params: { id: task.id } }} asChild>
          <Pressable
            className="min-h-[52px] flex-1 justify-center py-2 pr-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <Animated.Text
              style={[
                styles.title,
                {
                  color: palette.text,
                  textDecorationLine: isDone ? "line-through" : "none",
                },
                titleAnim,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Animated.Text>
            {dueLine || pg ? (
              <View style={styles.metaRow}>
                {dueLine ? (
                  <Text style={[styles.meta, { color: palette.textMuted }]}>{dueLine}</Text>
                ) : null}
                {dueLine && pg ? (
                  <Text style={[styles.metaDot, { color: palette.textMuted }]}>·</Text>
                ) : null}
                {pg ? <Text style={[styles.meta, { color: palette.textMuted }]}>{pg}</Text> : null}
              </View>
            ) : null}
          </Pressable>
        </Link>
      </Card>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  checkboxHit: {
    width: TOUCH,
    minHeight: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOutline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "500",
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
    lineHeight: FontSize.md * 1.35,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  meta: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaDot: {
    fontSize: FontSize.xs,
    fontWeight: "500",
  },
  swipeRightRow: {
    flexDirection: "row",
  },
  swipeSide: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  swipePress: {
    width: TOUCH,
    height: TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
})
