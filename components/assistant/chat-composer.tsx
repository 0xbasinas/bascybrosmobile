import { Ionicons } from "@expo/vector-icons"
import { Platform, Pressable, StyleSheet, TextInput, View, useColorScheme } from "react-native"

import { FontSize, Radius, Spacing, usePalette } from "@/lib/theme"

/** Same height as globe plate so placeholder / first line aligns with send icon vertically. */
const SIDE = 42

/** Tight composer: themed Web icon button + send, short bar. */
export function ChatComposer({
  prompt,
  streaming,
  webSearch,
  onPromptChange,
  onToggleWebSearch,
  onSend,
  onStop,
}: {
  prompt: string
  streaming: boolean
  webSearch: boolean
  onPromptChange: (value: string) => void
  onToggleWebSearch: (value: boolean) => void
  onSend: () => void
  onStop: () => void
}) {
  const palette = usePalette()
  const scheme = useColorScheme() ?? "light"
  const canSend = !streaming && Boolean(prompt.trim())

  /** Off = solid mist gray on light (not “more white” on white); on = true #fff. */
  const webPlateOff = scheme === "dark" ? "rgba(255,255,255,0.24)" : "#ddd9d6"
  const webPlateOn = "#ffffff"
  const webOnInk = "#1c1917"

  return (
    <View style={styles.root}>
      <View style={[styles.bar, { backgroundColor: palette.surfaceMuted }]}>
        <Pressable
          onPress={() => !streaming && onToggleWebSearch(!webSearch)}
          disabled={streaming}
          accessibilityRole="switch"
          accessibilityLabel={`Web search ${webSearch ? "on, live results" : "off, workspace only"}`}
          accessibilityHint="Solid white square behind the globe means web search is on"
          accessibilityState={{ checked: webSearch, disabled: streaming }}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.12)", borderless: false }}
          style={({ pressed }) => [
            styles.platePressable,
            Platform.OS === "android" && styles.platePressableAndroid,
            { opacity: streaming ? 0.45 : pressed ? 0.92 : 1 },
          ]}
        >
          <View
            collapsable={false}
            style={[
              styles.plateFace,
              {
                backgroundColor: webSearch ? webPlateOn : webPlateOff,
                borderColor:
                  scheme === "dark"
                    ? "rgba(255,255,255,0.28)"
                    : webSearch
                      ? "rgba(0,0,0,0.12)"
                      : palette.border,
                ...(webSearch && Platform.OS === "ios"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.12,
                      shadowRadius: 2,
                    }
                  : null),
                ...(webSearch && Platform.OS === "android" ? { elevation: 2 } : null),
              },
            ]}
          >
            <Ionicons
              name={webSearch ? "globe" : "globe-outline"}
              size={20}
              color={webSearch ? webOnInk : palette.textMuted}
            />
          </View>
        </Pressable>

        <TextInput
          placeholder="Send a message…"
          placeholderTextColor={palette.textMuted}
          value={prompt}
          onChangeText={onPromptChange}
          multiline
          editable={!streaming}
          accessibilityLabel="Message input"
          style={[
            styles.input,
            { color: palette.text },
            Platform.OS === "android"
              ? { includeFontPadding: false, textAlignVertical: "top" }
              : null,
          ]}
        />

        {streaming ? (
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            hitSlop={8}
            android_ripple={{ color: "rgba(220,38,38,0.22)", borderless: false }}
            style={({ pressed }) => [
              styles.platePressable,
              Platform.OS === "android" && styles.platePressableAndroid,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View
              collapsable={false}
              style={[
                styles.plateFace,
                {
                  backgroundColor:
                    scheme === "dark" ? "rgba(248, 113, 113, 0.14)" : "rgba(254, 242, 242, 0.98)",
                  borderColor:
                    scheme === "dark" ? "rgba(248, 113, 113, 0.38)" : "rgba(220, 38, 38, 0.28)",
                  ...(Platform.OS === "ios"
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                      }
                    : null),
                },
              ]}
            >
              <View style={[styles.stopChip, { backgroundColor: palette.danger }]} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            hitSlop={8}
            android_ripple={{ color: "rgba(0,0,0,0.12)", borderless: false }}
            style={({ pressed }) => [
              styles.platePressable,
              Platform.OS === "android" && styles.platePressableAndroid,
              { opacity: !canSend ? 0.5 : pressed ? 0.92 : 1 },
            ]}
          >
            <View
              collapsable={false}
              style={[
                styles.plateFace,
                {
                  backgroundColor: canSend ? webPlateOn : webPlateOff,
                  borderColor:
                    scheme === "dark"
                      ? "rgba(255,255,255,0.28)"
                      : canSend
                        ? "rgba(0,0,0,0.12)"
                        : palette.border,
                  ...(canSend && Platform.OS === "ios"
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.12,
                        shadowRadius: 2,
                      }
                    : null),
                  ...(canSend && Platform.OS === "android" ? { elevation: 2 } : null),
                },
              ]}
            >
              <Ionicons
                name={canSend ? "arrow-up" : "arrow-up-outline"}
                size={20}
                color={canSend ? webOnInk : palette.textMuted}
                style={styles.sendGlyph}
              />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: Platform.OS === "ios" ? 6 : 5,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  platePressable: {
    borderRadius: Radius.md,
    flexShrink: 0,
  },
  /** Android: transparent hit target + clip ripple; avoids grey “underlay” with rounded plates. */
  platePressableAndroid: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  plateFace: {
    width: SIDE,
    height: SIDE,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  stopChip: {
    width: 13,
    height: 13,
    borderRadius: 2,
  },
  input: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: SIDE,
    maxHeight: 140,
    paddingTop: Platform.OS === "ios" ? 11 : 10,
    paddingBottom: Platform.OS === "ios" ? 11 : 10,
    fontSize: FontSize.md,
    lineHeight: Math.round(FontSize.md * 1.43),
    marginVertical: Platform.OS === "android" ? 0 : undefined,
  },
  /** Arrow glyph sits slightly high in the ion font; nudge down to match text cap height feel. */
  sendGlyph: {
    marginTop: Platform.OS === "ios" ? 1 : 0,
  },
})
