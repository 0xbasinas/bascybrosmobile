import { Stack } from "expo-router"

import { UserMenu } from "@/components/user-menu"
import { usePalette } from "@/lib/theme"

export default function NotesStackLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: "Notes",
          headerRight: () => <UserMenu />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "New note", presentation: "modal", headerLargeTitle: false }}
      />
      <Stack.Screen name="[id]" options={{ title: "Note", headerLargeTitle: false }} />
    </Stack>
  )
}
