import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import * as WebBrowser from "expo-web-browser"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"

import { EmptyState } from "@/components/ui/empty"
import { useApi, HttpError } from "@/lib/api"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { NewsItem } from "@/lib/types"

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
        <View style={styles.loading}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : query.error ? (
        <EmptyState title="Couldn't load news" description={query.error.message} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No articles"
          description="Pull down to refresh."
        />
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
          renderItem={({ item }) => <NewsRow item={item} />}
        />
      )}
    </View>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  const palette = usePalette()
  const date = formatDate(item.pubDate)

  return (
    <Pressable
      onPress={() => {
        WebBrowser.openBrowserAsync(item.link).catch(() => Linking.openURL(item.link))
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: palette.textMuted, fontSize: FontSize.xs, fontWeight: "600" }}>
          {item.source.toUpperCase()}
          {date ? ` · ${date}` : ""}
        </Text>
        <Text
          style={{ color: palette.text, fontSize: FontSize.md, fontWeight: "600" }}
          numberOfLines={3}
        >
          {item.title}
        </Text>
        {item.summary ? (
          <Text
            style={{ color: palette.textMuted, fontSize: FontSize.sm, marginTop: 2 }}
            numberOfLines={3}
          >
            {item.summary}
          </Text>
        ) : null}
      </View>
      <Ionicons name="open-outline" size={18} color={palette.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: Spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
