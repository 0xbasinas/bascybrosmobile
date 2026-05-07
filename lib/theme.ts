import { useColorScheme } from "react-native"

export type ThemePalette = {
  background: string
  surface: string
  surfaceMuted: string
  border: string
  text: string
  textMuted: string
  textInverse: string
  primary: string
  primaryText: string
  danger: string
  success: string
  link: string
}

const lightPalette: ThemePalette = {
  background: "#ffffff",
  surface: "#f8fafc",
  surfaceMuted: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  textInverse: "#ffffff",
  primary: "#0f172a",
  primaryText: "#ffffff",
  danger: "#dc2626",
  success: "#16a34a",
  link: "#2563eb",
}

const darkPalette: ThemePalette = {
  background: "#0a0a0a",
  surface: "#111111",
  surfaceMuted: "#171717",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  textInverse: "#0a0a0a",
  primary: "#fafafa",
  primaryText: "#0a0a0a",
  danger: "#ef4444",
  success: "#22c55e",
  link: "#60a5fa",
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 30,
} as const

export function usePalette(): ThemePalette {
  const scheme = useColorScheme()
  return scheme === "dark" ? darkPalette : lightPalette
}
