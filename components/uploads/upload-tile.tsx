import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { Pressable, StyleSheet, View } from "react-native"

import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { UploadedFile } from "@/lib/types"
import { safeOpenUrl } from "@/lib/safe-open-url"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadTile({
  file,
  tileWidth,
  onDelete,
}: {
  file: UploadedFile
  tileWidth: number
  onDelete: () => void
}) {
  const palette = usePalette()

  return (
    <Pressable
      onPress={() => {
        void safeOpenUrl(file.url)
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, { width: tileWidth }]}
    >
      <PageSection style={styles.tileCard} contentStyle={styles.tileContent}>
        <Image
          source={{ uri: file.url }}
          style={{ width: "100%", height: tileWidth, backgroundColor: palette.surfaceMuted }}
          contentFit="cover"
        />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {file.filename}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="muted" selectable>
              {formatSize(file.size)}
            </Text>
            <Pressable
              hitSlop={6}
              onPress={onDelete}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="trash-outline" size={16} color={palette.danger} />
            </Pressable>
          </View>
        </View>
      </PageSection>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tileCard: {
    overflow: "hidden",
  },
  tileContent: {
    gap: 0,
    padding: 0,
  },
  meta: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
