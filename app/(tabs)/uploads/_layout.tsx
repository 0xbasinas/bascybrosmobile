import { Stack } from "expo-router"

import { UserMenu } from "@/components/user-menu"
import { usePalette } from "@/lib/theme"

export default function UploadsStackLayout() {
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
        options={{ title: "Uploads", headerRight: () => <UserMenu /> }}
      />
    </Stack>
  )
}
