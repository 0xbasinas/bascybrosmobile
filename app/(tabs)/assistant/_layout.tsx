import { Stack } from "expo-router"

import { usePalette } from "@/lib/theme"

export default function AssistantStackLayout() {
  const palette = usePalette()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerLargeStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        headerTintColor: palette.text,
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[chatId]"
        options={{ title: "Chat", headerLargeTitle: false }}
      />
    </Stack>
  )
}
