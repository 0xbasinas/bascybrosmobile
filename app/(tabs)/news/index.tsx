import { FlatList, RefreshControl, StyleSheet, View } from "react-native"
import { useQuery } from "@tanstack/react-query"

import { NewsRow } from "@/components/news/news-row"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { useApi, HttpError } from "@/lib/api"
import { Spacing, usePalette } from "@/lib/theme"
import type { NewsItem } from "@/lib/types"

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
          renderItem={({ item }) => <NewsRow item={item} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagePadding: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  stateFill: {
    flex: 1,
  },
  stateCard: { minHeight: 220 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
})
