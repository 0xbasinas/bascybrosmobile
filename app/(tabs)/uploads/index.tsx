import { useState } from "react"
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { useApi, HttpError } from "@/lib/api"
import { useUploadImage, type PickedImage } from "@/lib/hooks/useUploadImage"
import { FontSize, Spacing, usePalette } from "@/lib/theme"
import type { UploadedFile } from "@/lib/types"
import { safeOpenUrl } from "@/lib/safe-open-url"

const COLUMNS = 2

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadsScreen() {
  const palette = usePalette()
  const { requestJson } = useApi()
  const { upload, pickFromCamera, pickFromLibrary } = useUploadImage()
  const queryClient = useQueryClient()
  const { width } = useWindowDimensions()

  const [busy, setBusy] = useState(false)
  const tileWidth = (width - Spacing.lg * 2 - Spacing.sm * (COLUMNS - 1)) / COLUMNS

  const query = useQuery<{ ok: boolean; files: UploadedFile[] }, HttpError>({
    queryKey: ["uploads"],
    queryFn: () => requestJson("/api/mobile/uploads"),
  })

  const remove = useMutation<unknown, HttpError, string>({
    mutationFn: (id) =>
      requestJson(`/api/mobile/uploads/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploads"] }),
    onError: (err) => Alert.alert("Couldn't delete", err.message),
  })

  async function handleUpload(picked: PickedImage | null) {
    if (!picked) return
    setBusy(true)
    try {
      await upload(picked)
      await queryClient.invalidateQueries({ queryKey: ["uploads"] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed."
      Alert.alert("Upload failed", msg)
    } finally {
      setBusy(false)
    }
  }

  async function handleCamera() {
    try {
      const picked = await pickFromCamera()
      await handleUpload(picked)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera unavailable."
      Alert.alert("Camera", msg)
    }
  }

  async function handleLibrary() {
    try {
      const picked = await pickFromLibrary()
      await handleUpload(picked)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Picker unavailable."
      Alert.alert("Library", msg)
    }
  }

  const files = query.data?.files ?? []

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topPadding}>
        <PageSection
          title="Uploads"
          description="Capture screenshots or photos, then reopen them from your mobile workspace."
          contentStyle={styles.toolbarSection}
        >
          <View style={styles.toolbar}>
            <AppButton
              title="Take photo"
              onPress={handleCamera}
              loading={busy}
              style={styles.flex}
            />
            <AppButton
              title="From library"
              variant="secondary"
              onPress={handleLibrary}
              loading={busy}
              style={styles.flex}
            />
          </View>
        </PageSection>
      </View>

      {query.isLoading ? (
        <View style={styles.statePadding}>
          <LoadingState label="Loading uploads..." style={styles.stateFill} />
        </View>
      ) : query.error ? (
        <View style={styles.statePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState title="Couldn't load uploads" description={query.error.message} />
          </PageSection>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.statePadding}>
          <PageSection contentStyle={styles.stateCard}>
            <EmptyState
              title="No uploads yet"
              description="Tap a button above to add a screenshot or photo."
            />
          </PageSection>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: Spacing.sm }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => query.refetch()}
              tintColor={palette.text}
            />
          }
          ListHeaderComponent={
            <PageSection
              title={`${files.length} ${files.length === 1 ? "file" : "files"}`}
              description="Tap a card to view the original asset."
              contentStyle={styles.summaryContent}
            >
              <Text variant="muted" selectable>
                Delete anything you no longer need directly from the grid.
              </Text>
            </PageSection>
          }
          renderItem={({ item }) => (
            <Tile
              file={item}
              tileWidth={tileWidth}
              onDelete={() =>
                Alert.alert("Delete image?", item.filename, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => remove.mutate(item.id),
                  },
                ])
              }
            />
          )}
        />
      )}
    </View>
  )
}

function Tile({
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
      <PageSection contentStyle={styles.tileContent}>
        <Image
          source={{ uri: file.url }}
          style={{ width: "100%", height: tileWidth, backgroundColor: palette.surfaceMuted }}
          contentFit="cover"
        />
        <View style={styles.tileMeta}>
          <Text style={styles.tileTitle} numberOfLines={1}>
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
  container: { flex: 1 },
  topPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  toolbarSection: {
    gap: Spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  flex: { flex: 1 },
  statePadding: {
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
  tileContent: {
    gap: 0,
    padding: 0,
  },
  tileMeta: {
    padding: Spacing.sm,
    gap: 4,
  },
  tileTitle: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
