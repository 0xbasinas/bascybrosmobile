import { StyleSheet, View } from "react-native"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { PageSection } from "@/components/ui/page"
import { Segmented } from "@/components/ui/segmented"
import { Spacing } from "@/lib/theme"
import { type TaskStatus } from "@/lib/types"

type FilterValue = TaskStatus | "all"

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Prog." },
  { value: "done", label: "Done" },
]

export function TasksControls({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onCreate,
}: {
  search: string
  filter: FilterValue
  onSearchChange: (value: string) => void
  onFilterChange: (value: FilterValue) => void
  onCreate: () => void
}) {
  return (
    <PageSection contentStyle={styles.content}>
      <View style={styles.toolbar}>
        <AppTextInput
          placeholder="Search tasks..."
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.flex}
        />
        <AppButton title="New task" size="md" onPress={onCreate} />
      </View>
      <Segmented options={FILTER_OPTIONS} value={filter} onChange={onFilterChange} />
    </PageSection>
  )
}

export { FILTER_OPTIONS }
export type { FilterValue }

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
})
