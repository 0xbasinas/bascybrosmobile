import { useState } from "react"
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { EmptyState } from "@/components/ui/empty"
import { LoadingState, PageSection } from "@/components/ui/page"
import { UploadTile } from "@/components/uploads/upload-tile"
import { UploadsActions } from "@/components/uploads/uploads-actions"
import { useApi, HttpError } from "@/lib/api"
import { useUploadImage, type PickedImage } from "@/lib/hooks/useUploadImage"
import { Spacing, usePalette } from "@/lib/theme"
import type { UploadedFile } from "@/lib/types"

const COLUMNS = 2

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
        <UploadsActions busy={busy} onCamera={handleCamera} onLibrary={handleLibrary} />
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
          contentInsetAdjustmentBehavior="automatic"
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
          renderItem={({ item }) => (
            <UploadTile
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  topPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statePadding: {
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
