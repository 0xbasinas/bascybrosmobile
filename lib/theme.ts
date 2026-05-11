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
  background: "#f7f2eb",
  surface: "#fdf9f4",
  surfaceMuted: "#efe7dc",
  border: "#dccfc1",
  text: "#44372f",
  textMuted: "#7f7063",
  textInverse: "#fdf9f4",
  primary: "#7a6758",
  primaryText: "#fdf9f4",
  danger: "#b76555",
  success: "#768467",
  link: "#8d7461",
}

const darkPalette: ThemePalette = {
  background: "#2f2722",
  surface: "#3a312b",
  surfaceMuted: "#453a33",
  border: "#5b4e45",
  text: "#f3ebe3",
  textMuted: "#b6a899",
  textInverse: "#2f2722",
  primary: "#e2d5c7",
  primaryText: "#342b25",
  danger: "#d18a7b",
  success: "#9dae94",
  link: "#d0b4a0",
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
    accent: "#efe2d3",
    accentForeground: lightPalette.text,
    destructive: lightPalette.danger,
    border: lightPalette.border,
    input: lightPalette.border,
    ring: "#bca895",
    radius: "0.625rem",
    chart1: "#d6c8bb",
    chart2: "#af9f8f",
    chart3: "#8f7e6d",
    chart4: "#715f50",
    chart5: "#56463a",
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
    accent: "#52453c",
    accentForeground: darkPalette.text,
    destructive: darkPalette.danger,
    border: darkPalette.border,
    input: darkPalette.border,
    ring: "#9f8f82",
    radius: "0.625rem",
    chart1: "#cabba9",
    chart2: "#aa9884",
    chart3: "#887766",
    chart4: "#6b5b4d",
    chart5: "#56473b",
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
