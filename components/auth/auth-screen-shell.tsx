import type { ReactNode } from "react"
import { View } from "react-native"

import { Card, CardContent } from "@/components/ui/card"
import { PageScrollView } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { APP_AUTH_TAGLINE, APP_NAME } from "@/lib/config"

export function AuthScreenShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <PageScrollView keyboardAvoiding contentContainerStyle={{ justifyContent: "center" }}>
      <View className="w-full max-w-[440px] self-center gap-5">
        <View className="items-center gap-3 px-2">
          <View className="rounded-full border border-border bg-secondary px-3 py-1">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
              {APP_NAME}
            </Text>
          </View>
          <View className="items-center gap-2">
            <Text className="text-center text-sm leading-6 text-muted-foreground">
              {APP_AUTH_TAGLINE}
            </Text>
            <Text className="text-center text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </Text>
            <Text className="text-center text-sm leading-6 text-muted-foreground">
              {description}
            </Text>
          </View>
        </View>
        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm shadow-black/5">
          <CardContent className="gap-5 px-5 py-5 sm:px-6 sm:py-6">{children}</CardContent>
        </Card>
      </View>
    </PageScrollView>
  )
}
