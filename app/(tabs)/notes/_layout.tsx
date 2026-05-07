import { Stack } from "expo-router"

import { SignOutButton } from "@/components/sign-out-button"
import { usePalette } from "@/lib/theme"

export default function NotesStackLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: "Notes",
          headerRight: () => <SignOutButton />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "New note", presentation: "modal" }}
      />
      <Stack.Screen name="[id]" options={{ title: "Note" }} />
    </Stack>
  )
}
