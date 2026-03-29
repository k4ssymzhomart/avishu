import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import type { LoyaltySummary } from '@/types/customerProfile';

function getProgressCopy(loyalty: LoyaltySummary, pointsUntilLabel: string) {
  if (loyalty.nextTier && loyalty.pointsToNextTier > 0) {
    return `${loyalty.pointsToNextTier} ${pointsUntilLabel} ${loyalty.nextTier}`;
  }

  return `You reached ${loyalty.tier}`;
}

export function CustomerLoyaltySummary({
  loyalty,
  pointsUntilLabel,
}: {
  loyalty: LoyaltySummary;
  pointsUntilLabel: string;
}) {
  const progressCopy = getProgressCopy(loyalty, pointsUntilLabel);
  const futureBenefitCopy = loyalty.benefits.discountPercent
    ? `${loyalty.benefits.discountPercent}% OFF ON FUTURE ORDERS`
    : 'POINTS ACCUMULATION ACTIVE';

  return (
    <Card padding="lg" style={styles.card} variant="inverse">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AVISHU MEMBERSHIP</Text>
          <Text style={styles.tier}>{loyalty.tier}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{loyalty.benefits.label}</Text>
        </View>
      </View>

      <View style={styles.pointsRow}>
        <View style={styles.pointsCopy}>
          <Text style={styles.pointsValue}>{loyalty.points}</Text>
          <Text style={styles.pointsLabel}>LOYALTY POINTS</Text>
        </View>

        <View style={styles.metaColumn}>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>COMPLETED ORDERS</Text>
            <Text style={styles.metaValue}>{loyalty.totalOrders}</Text>
          </View>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>LIFETIME SPENT</Text>
            <Text style={styles.metaValue}>{formatCurrency(loyalty.lifetimeSpent)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressCopy}>{progressCopy}</Text>
          <Text style={styles.progressMeta}>
            {loyalty.nextTierThreshold ? `${loyalty.progressPercent}%` : 'TOP TIER'}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${loyalty.progressPercent}%` }]} />
        </View>
        <Text style={styles.benefitCopy}>{futureBenefitCopy}</Text>
        <Text style={styles.benefitNote}>{loyalty.benefits.rewardText}</Text>
      </View>

      <View style={styles.perkRow}>
        {loyalty.benefits.perkLabels.map((perk) => (
          <View key={perk} style={styles.perkChip}>
            <Text style={styles.perkLabel}>{perk}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 108,
    paddingHorizontal: theme.spacing.md,
  },
  badgeLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  benefitCopy: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  benefitNote: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  card: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: 26,
    gap: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaColumn: {
    flex: 1,
    gap: theme.spacing.sm,
    minWidth: 170,
  },
  metaLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaTile: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderWidth: theme.borders.width.thin,
    gap: 6,
    padding: theme.spacing.md,
  },
  metaValue: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  perkChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  perkLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  perkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pointsCopy: {
    flex: 1,
    gap: 2,
    minWidth: 160,
  },
  pointsLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  pointsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  pointsValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: 42,
    lineHeight: 46,
  },
  progressBlock: {
    gap: theme.spacing.sm,
  },
  progressCopy: {
    color: theme.colors.text.inverse,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  progressFill: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: 999,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  progressMeta: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  tier: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
