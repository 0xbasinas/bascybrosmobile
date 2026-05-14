import { View } from "react-native"

import { Text } from "@/components/ui/text"

export function ListHero({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View className="mb-1 gap-1">
      <Text variant="small" className="text-muted-foreground uppercase tracking-widest">
        {eyebrow}
      </Text>
      <Text variant="h3" className="tracking-tight">
        {title}
      </Text>
    </View>
  )
}
