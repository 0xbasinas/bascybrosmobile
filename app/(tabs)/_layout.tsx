import { Tabs, Redirect } from "expo-router"
import { useAuth } from "@clerk/expo"
import { ActivityIndicator, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { usePalette } from "@/lib/theme"
import { useMe } from "@/lib/hooks/useMe"

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const palette = usePalette()
  const meQuery = useMe()

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
        }}
      >
        <ActivityIndicator color={palette.text} />
      </View>
    )
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
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
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
