import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@clerk/expo"

import { useApi } from "@/lib/api"

export type Me = {
  userId: string
  email: string | null
  allowed: boolean
  isAdmin: boolean
}

export function useMe() {
  const { isSignedIn } = useAuth()
  const { requestJson } = useApi()

  return useQuery<{ ok: boolean; me: Me }>({
    queryKey: ["me"],
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
    queryFn: () => requestJson("/api/mobile/me"),
  })
}
