import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import { AppButton } from "@/components/ui/button"
import { AppTextInput } from "@/components/ui/input"
import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

export function NotesControls({
  search,
  onSearchChange,
  tags,
  selectedTag,
  onSelectTag,
  onCreate,
}: {
  search: string
  onSearchChange: (value: string) => void
  tags: string[]
  selectedTag: string | null
  onSelectTag: (value: string | null) => void
  onCreate: () => void
}) {
  return (
    <PageSection contentStyle={styles.content}>
      <View style={styles.toolbar}>
        <AppTextInput
          placeholder="Search notes..."
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.flex}
        />
        <AppButton title="New note" size="md" onPress={onCreate} />
      </View>

      {tags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          <TagChip
            label="All"
            active={selectedTag === null}
            onPress={() => onSelectTag(null)}
          />
          {tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              active={selectedTag === tag}
              onPress={() => onSelectTag(selectedTag === tag ? null : tag)}
            />
          ))}
        </ScrollView>
      ) : null}
    </PageSection>
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
  tagRow: {
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
})
