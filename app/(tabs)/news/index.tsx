import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"

import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
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

export default function NewsScreen() {
  const palette = usePalette()
  const { requestJson } = useApi()

  const query = useQuery<{ ok: boolean; items: NewsItem[] }, HttpError>({
    queryKey: ["news"],
    queryFn: () => requestJson("/api/mobile/news"),
    staleTime: 5 * 60_000,
  })

  const items = query.data?.items ?? []

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {query.isLoading ? (
        <View style={styles.pagePadding}>
          <LoadingState label="Loading news..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load news" description={query.error.message} />
          </PageSection>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.pagePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="No articles" description="Pull down to refresh." />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.link}-${index}`}
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
              title="Daily brief"
              description="A quick feed of the latest articles worth checking on mobile."
              contentStyle={styles.summaryContent}
            >
              <Text variant="muted" selectable>
                Open any card to launch the original source.
              </Text>
            </PageSection>
          }
          renderItem={({ item }) => <NewsRow item={item} />}
        />
      )}
    </View>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  const date = formatDate(item.pubDate)
  const palette = usePalette()

  return (
    <Pressable
      onPress={() => {
        void safeOpenUrl(item.link)
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <PageSection contentStyle={styles.rowContent}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowEyebrow, { color: palette.textMuted }]} selectable>
              {item.source.toUpperCase()}
              {date ? ` · ${date}` : ""}
            </Text>
            <Text style={styles.rowTitle} numberOfLines={3}>
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
  container: { flex: 1 },
  pagePadding: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stateFill: {
    flex: 1,
  },
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
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
})
