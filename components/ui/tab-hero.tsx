import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { PageSection } from "@/components/ui/page"
import { Text } from "@/components/ui/text"
import { Radius, Spacing, usePalette } from "@/lib/theme"

type TabHeroStat = {
  label: string
  value: string
}

export function TabHero({
  icon,
  eyebrow,
  description,
  stats,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"]
  eyebrow: string
  description: string
  stats?: TabHeroStat[]
  children?: ReactNode
}) {
  const palette = usePalette()

  return (
    <PageSection contentStyle={styles.content}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={palette.text} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: palette.textMuted }]} selectable>
            {eyebrow}
          </Text>
          <Text style={styles.description} selectable>
            {description}
          </Text>
        </View>
      </View>

      {stats?.length ? (
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]} selectable>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {children ? <View style={styles.slot}>{children}</View> : null}
    </PageSection>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    minWidth: 92,
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  slot: {
    gap: Spacing.md,
  },
})
