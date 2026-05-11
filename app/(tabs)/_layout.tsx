import { Tabs, Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { LoadingScreen } from "@/components/ui/page"
import { Spacing, usePalette } from "@/lib/theme"
import { useMe } from "@/lib/hooks/useMe"

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const meQuery = useMe()

  if (!isLoaded) {
    return <LoadingScreen label="Loading tabs..." />
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />
  }

  if (meQuery.data && meQuery.data.me.allowed === false) {
    return <Redirect href="/unauthorized" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarStyle: {
          height: 62 + Math.max(insets.bottom, Spacing.sm),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="uploads"
        options={{
          title: "Uploads",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
