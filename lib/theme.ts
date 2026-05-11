import { useColorScheme } from "react-native"
import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native"

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
  surface: "#ffffff",
  surfaceMuted: "#f4f3f2",
  border: "#e7e5e4",
  text: "#1c1917",
  textMuted: "#78716c",
  textInverse: "#fafaf9",
  primary: "#292524",
  primaryText: "#fafaf9",
  danger: "#dc2626",
  success: "#15803d",
  link: "#292524",
}

const darkPalette: ThemePalette = {
  background: "#1c1917",
  surface: "#292524",
  surfaceMuted: "#3c3330",
  border: "rgba(255, 255, 255, 0.10)",
  text: "#fafaf9",
  textMuted: "#a8a29e",
  textInverse: "#292524",
  primary: "#e7e5e4",
  primaryText: "#292524",
  danger: "#f87171",
  success: "#4ade80",
  link: "#e7e5e4",
}

export const THEME = {
  light: {
    background: lightPalette.background,
    foreground: lightPalette.text,
    card: lightPalette.surface,
    cardForeground: lightPalette.text,
    popover: lightPalette.surface,
    popoverForeground: lightPalette.text,
    primary: lightPalette.primary,
    primaryForeground: lightPalette.primaryText,
    secondary: lightPalette.surfaceMuted,
    secondaryForeground: lightPalette.text,
    muted: lightPalette.surfaceMuted,
    mutedForeground: lightPalette.textMuted,
    accent: lightPalette.surfaceMuted,
    accentForeground: lightPalette.text,
    destructive: lightPalette.danger,
    border: lightPalette.border,
    input: lightPalette.border,
    ring: "#a8a29e",
    radius: "0.625rem",
    chart1: "#d6d3d1",
    chart2: "#78716c",
    chart3: "#57534e",
    chart4: "#44403c",
    chart5: "#292524",
  },
  dark: {
    background: darkPalette.background,
    foreground: darkPalette.text,
    card: darkPalette.surface,
    cardForeground: darkPalette.text,
    popover: darkPalette.surface,
    popoverForeground: darkPalette.text,
    primary: darkPalette.primary,
    primaryForeground: darkPalette.primaryText,
    secondary: darkPalette.surfaceMuted,
    secondaryForeground: darkPalette.text,
    muted: darkPalette.surfaceMuted,
    mutedForeground: darkPalette.textMuted,
    accent: darkPalette.surfaceMuted,
    accentForeground: darkPalette.text,
    destructive: darkPalette.danger,
    border: darkPalette.border,
    input: "rgba(255, 255, 255, 0.15)",
    ring: "#78716c",
    radius: "0.625rem",
    chart1: "#d6d3d1",
    chart2: "#78716c",
    chart3: "#57534e",
    chart4: "#44403c",
    chart5: "#3c3330",
  },
} as const

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
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
