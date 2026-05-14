import { Ionicons } from "@expo/vector-icons"
import * as React from "react"
import { View } from "react-native"

import { AppTextInput, type AppTextInputProps } from "@/components/ui/input"
import { usePalette } from "@/lib/theme"
import { cn } from "@/lib/utils"

type ListSearchBarProps = AppTextInputProps & {
  containerClassName?: string
}

export const ListSearchBar = React.forwardRef<React.ComponentRef<typeof AppTextInput>, ListSearchBarProps>(
  function ListSearchBar({ containerClassName, className, ...props }, ref) {
    const palette = usePalette()
    return (
      <View
        className={cn(
          "flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm shadow-black/5",
          containerClassName,
        )}
      >
        <Ionicons name="search" size={18} color={palette.textMuted} />
        <AppTextInput
          ref={ref}
          className={cn(
            "h-11 flex-1 border-0 bg-transparent px-2 shadow-none dark:bg-transparent",
            className,
          )}
          {...props}
        />
      </View>
    )
  },
)
