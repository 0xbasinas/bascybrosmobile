import { useCallback } from "react"
import * as ImagePicker from "expo-image-picker"

import { useApi } from "@/lib/api"

type UploadResponse = {
  url: string
  storagePath: string
  filename: string
  mimeType: string
  size: number
  entityType?: string | null
  entityId?: string | null
}

export type PickedImage = {
  uri: string
  name: string
  mimeType: string
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
])

function inferMime(uri: string, fallback?: string | null): string {
  if (fallback && ALLOWED_MIME.has(fallback)) return fallback
  const lower = uri.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/jpeg"
  if (lower.endsWith(".avif")) return "image/avif"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  return "image/jpeg"
}

function inferName(uri: string, fallback?: string | null): string {
  if (fallback && fallback.includes(".")) return fallback
  const tail = uri.split("/").pop() ?? `image-${Date.now()}.jpg`
  if (tail.includes(".")) return tail
  return `${tail}.jpg`
}

export function useUploadImage() {
  const { request, requestJson } = useApi()

  const upload = useCallback(
    async (image: PickedImage): Promise<UploadResponse> => {
      const form = new FormData()
      form.append("file", {
        uri: image.uri,
        name: image.name,
        type: image.mimeType,
      } as unknown as Blob)

      const response = await request("/api/upload", {
        method: "POST",
        body: form,
      })

      if (!response.ok) {
        let message = `Upload failed (${response.status})`
        try {
          const data = (await response.json()) as { error?: unknown }
          if (typeof data?.error === "string") message = data.error
        } catch {
          /* empty */
        }
        throw new Error(message)
      }

      const data = (await response.json()) as UploadResponse

      await requestJson("/api/mobile/uploads/register", {
        method: "POST",
        body: {
          storagePath: data.storagePath,
          url: data.url,
          filename: data.filename,
          mimeType: data.mimeType,
          size: data.size,
        },
      })

      return data
    },
    [request, requestJson]
  )

  const pickFromLibrary = useCallback(async (): Promise<PickedImage | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    })
    if (result.canceled || result.assets.length === 0) return null
    const asset = result.assets[0]!
    return {
      uri: asset.uri,
      name: inferName(asset.uri, asset.fileName ?? null),
      mimeType: inferMime(asset.uri, asset.mimeType ?? null),
    }
  }, [])

  const pickFromCamera = useCallback(async (): Promise<PickedImage | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      throw new Error("Camera permission denied.")
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    })
    if (result.canceled || result.assets.length === 0) return null
    const asset = result.assets[0]!
    return {
      uri: asset.uri,
      name: inferName(asset.uri, asset.fileName ?? null),
      mimeType: inferMime(asset.uri, asset.mimeType ?? null),
    }
  }, [])

  return { upload, pickFromLibrary, pickFromCamera }
}
