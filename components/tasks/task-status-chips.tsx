import { StyleSheet, View } from "react-native"

import { FilterChip } from "@/components/lists/filter-chip"
import { Spacing } from "@/lib/theme"
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types"

export function TaskStatusChips({
  value,
  onChange,
  disabled,
}: {
  value: TaskStatus
  onChange: (next: TaskStatus) => void
  disabled?: boolean
}) {
  return (
    <View style={styles.row}>
      {TASK_STATUSES.map((s) => (
        <FilterChip
          key={s}
          label={TASK_STATUS_LABELS[s]}
          selected={value === s}
          disabled={disabled}
          onPress={() => onChange(s)}
          accessibilityLabel={`Set status to ${TASK_STATUS_LABELS[s]}`}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
})
