import { useMemo } from "react"
import { EnrichedMarkdownText } from "react-native-enriched-markdown"

import { FontSize, usePalette } from "@/lib/theme"
import { safeOpenUrl } from "@/lib/safe-open-url"

type Props = {
  markdown: string
  flavor?: "github" | "commonmark"
  onLinkPress?: (url: string) => void
}

export function MarkdownView({ markdown, flavor = "github", onLinkPress }: Props) {
  const palette = usePalette()

  const trimmed = (markdown ?? "").trim()

  const markdownStyle = useMemo(
    () => ({
      paragraph: {
        color: palette.text,
        fontSize: FontSize.md,
        lineHeight: 22,
      },
      h1: { color: palette.text, fontSize: 26, fontWeight: "700" as const },
      h2: { color: palette.text, fontSize: 22, fontWeight: "700" as const },
      h3: { color: palette.text, fontSize: 18, fontWeight: "600" as const },
      h4: { color: palette.text, fontSize: 16, fontWeight: "600" as const },
      h5: { color: palette.text, fontSize: 15, fontWeight: "600" as const },
      h6: { color: palette.text, fontSize: 14, fontWeight: "600" as const },
      link: { color: palette.link, underline: true },
      strong: { color: palette.text },
      em: { color: palette.text },
      code: {
        color: palette.text,
        backgroundColor: palette.surfaceMuted,
        borderColor: palette.border,
      },
      codeBlock: {
        color: palette.text,
        backgroundColor: palette.surfaceMuted,
        borderColor: palette.border,
        borderRadius: 8,
        padding: 12,
      },
      blockquote: {
        backgroundColor: palette.surfaceMuted,
        borderColor: palette.border,
        borderWidth: 3,
        color: palette.textMuted,
      },
      list: {
        color: palette.text,
        bulletColor: palette.textMuted,
        markerColor: palette.textMuted,
      },
      table: {
        borderColor: palette.border,
        borderRadius: 8,
        headerBackgroundColor: palette.surfaceMuted,
        headerTextColor: palette.text,
        rowEvenBackgroundColor: palette.background,
        rowOddBackgroundColor: palette.surface,
        fontSize: 14,
        cellPaddingHorizontal: 10,
        cellPaddingVertical: 6,
        color: palette.text,
      },
      taskList: {
        checkedColor: palette.primary,
        borderColor: palette.border,
        checkmarkColor: palette.primaryText,
        checkedTextColor: palette.textMuted,
        checkedStrikethrough: true,
      },
    }),
    [palette]
  )

  return (
    <EnrichedMarkdownText
      markdown={trimmed.length > 0 ? trimmed : "_Empty_"}
      flavor={flavor}
      onLinkPress={({ url }) => {
        if (onLinkPress) return onLinkPress(url)
        void safeOpenUrl(url)
      }}
      markdownStyle={markdownStyle}
    />
  )
}
