import { Alert, Pressable } from "react-native"
import { useClerk } from "@clerk/expo"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { usePalette } from "@/lib/theme"

export function SignOutButton() {
  const palette = usePalette()
  const { signOut } = useClerk()
  const router = useRouter()

  function handlePress() {
    Alert.alert("Sign out?", "You'll need to sign in again to use BascyBros.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut()
          } finally {
            router.replace("/sign-in")
          }
        },
      },
    ])
  }

  return (
    <Pressable
      hitSlop={6}
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        paddingHorizontal: 6,
      })}
    >
      <Ionicons name="log-out-outline" size={22} color={palette.text} />
    </Pressable>
  )
}
