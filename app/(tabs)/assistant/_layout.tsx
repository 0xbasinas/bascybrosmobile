import { Stack } from "expo-router"

import { usePalette } from "@/lib/theme"

export default function AssistantStackLayout() {
  const palette = usePalette()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Assistant" }} />
      <Stack.Screen name="[chatId]" options={{ title: "Chat" }} />
    </Stack>
  )
}
