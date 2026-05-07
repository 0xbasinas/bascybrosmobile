import { Stack } from "expo-router"

import { usePalette } from "@/lib/theme"

export default function TasksStackLayout() {
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
      <Stack.Screen name="index" options={{ title: "Tasks" }} />
      <Stack.Screen name="new" options={{ title: "New task", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Task" }} />
    </Stack>
  )
}
