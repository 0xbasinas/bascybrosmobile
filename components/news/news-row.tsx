import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, View } from "react-native"

import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { NewsItem } from "@/lib/types"
import { safeOpenUrl } from "@/lib/safe-open-url"

function formatDate(value: string | null) {
  if (!value) return ""

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

export function NewsRow({ item }: { item: NewsItem }) {
  const date = formatDate(item.pubDate)
  const palette = usePalette()

  return (
    <Pressable
      onPress={() => {
        void safeOpenUrl(item.link)
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <PageSection contentStyle={styles.content}>
        <View style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={[styles.eyebrow, { color: palette.textMuted }]} selectable>
              {item.source.toUpperCase()}
              {date ? ` · ${date}` : ""}
            </Text>
            <Text style={styles.title} numberOfLines={3}>
              {item.title}
            </Text>
            {item.summary ? (
              <Text variant="muted" numberOfLines={3} selectable>
                {item.summary}
              </Text>
            ) : null}
          </View>
          <Ionicons name="open-outline" size={18} color={palette.textMuted} />
        </View>
      </PageSection>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
})
