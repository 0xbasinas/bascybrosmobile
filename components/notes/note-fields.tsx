import { StyleSheet } from "react-native"

import { AppTextInput } from "@/components/ui/input"
import { PageField } from "@/components/ui/page"
import { Spacing } from "@/lib/theme"

export function NoteFields({
  title,
  tags,
  content,
  onTitleChange,
  onTagsChange,
  onContentChange,
  contentPlaceholder = "Write your note in Markdown...",
  contentMinHeight = 280,
  titleDescription = "Give this note a clear name.",
  tagsDescription = "Comma-separated. They appear as #tags in your library.",
  contentDescription = "Markdown is supported for longer notes.",
}: {
  title: string
  tags: string
  content: string
  onTitleChange: (value: string) => void
  onTagsChange: (value: string) => void
  onContentChange: (value: string) => void
  contentPlaceholder?: string
  contentMinHeight?: number
  titleDescription?: string
  tagsDescription?: string
  contentDescription?: string
}) {
  return (
    <>
      <PageField label="Title" description={titleDescription}>
        <AppTextInput
          placeholder="Note title"
          value={title}
          onChangeText={onTitleChange}
          maxLength={200}
        />
      </PageField>

      <PageField label="Tags" description={tagsDescription}>
        <AppTextInput
          placeholder="ideas, work, journal"
          value={tags}
          onChangeText={onTagsChange}
          autoCapitalize="none"
        />
      </PageField>

      <PageField label="Content" description={contentDescription}>
        <AppTextInput
          multiline
          placeholder={contentPlaceholder}
          value={content}
          onChangeText={onContentChange}
          style={[styles.editor, { minHeight: contentMinHeight }]}
        />
      </PageField>
    </>
  )
}

const styles = StyleSheet.create({
  editor: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
  },
})
