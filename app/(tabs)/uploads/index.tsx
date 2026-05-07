import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import * as WebBrowser from "expo-web-browser"
import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AppButton } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty"
import { useApi, HttpError } from "@/lib/api"
import { useUploadImage, type PickedImage } from "@/lib/hooks/useUploadImage"
import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"
import type { UploadedFile } from "@/lib/types"

const COLUMNS = 2
const SCREEN_W = Dimensions.get("window").width
const TILE_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm * (COLUMNS - 1)) / COLUMNS

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

  const [busy, setBusy] = useState(false)

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
      <View style={styles.toolbar}>
        <AppButton
          title="Take photo"
          onPress={handleCamera}
          loading={busy}
          style={{ flex: 1 }}
        />
        <AppButton
          title="From library"
          variant="secondary"
          onPress={handleLibrary}
          loading={busy}
          style={{ flex: 1 }}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : query.error ? (
        <EmptyState title="Couldn't load uploads" description={query.error.message} />
      ) : files.length === 0 ? (
        <EmptyState
          title="No uploads yet"
          description="Tap a button above to add a screenshot or photo."
        />
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
          renderItem={({ item }) => (
            <Tile
              file={item}
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
  onDelete,
}: {
  file: UploadedFile
  onDelete: () => void
}) {
  const palette = usePalette()
  return (
    <Pressable
      onPress={() => {
        WebBrowser.openBrowserAsync(file.url).catch(() => Linking.openURL(file.url))
      }}
      style={({ pressed }) => [
        styles.tile,
        {
          width: TILE_W,
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Image
        source={{ uri: file.url }}
        style={{ width: "100%", height: TILE_W, backgroundColor: palette.surfaceMuted }}
        resizeMode="cover"
      />
      <View style={{ padding: Spacing.sm, gap: 4 }}>
        <Text
          style={{ color: palette.text, fontSize: FontSize.xs, fontWeight: "600" }}
          numberOfLines={1}
        >
          {file.filename}
        </Text>
        <View style={styles.metaRow}>
          <Text style={{ color: palette.textMuted, fontSize: FontSize.xs }}>
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
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: Spacing.lg },
  tile: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
