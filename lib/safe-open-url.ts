import { Alert, Linking } from "react-native"
import * as WebBrowser from "expo-web-browser"

const ALLOWED_SCHEMES = new Set(["https:"])

function normalizeUrl(raw: string) {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

export async function safeOpenUrl(raw: string, title = "Open link") {
  const url = normalizeUrl(raw)
  if (!url || !ALLOWED_SCHEMES.has(url.protocol)) {
    Alert.alert(title, "Blocked an unsafe link.")
    return false
  }

  try {
    await WebBrowser.openBrowserAsync(url.toString())
    return true
  } catch {
    try {
      await Linking.openURL(url.toString())
      return true
    } catch {
      Alert.alert(title, "Could not open link.")
      return false
    }
  }
}
