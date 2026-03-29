import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { theme } from '@/lib/theme/tokens';

export function FranchiseeOrderCardSkeleton() {
  return (
    <Card padding="lg" style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.identity}>
          <SkeletonBlock height={110} width={88} />
          <View style={styles.identityCopy}>
            <SkeletonBlock height={12} width="48%" />
            <SkeletonBlock height={28} width="72%" />
            <SkeletonBlock height={16} width="40%" />
            <SkeletonBlock height={12} width="55%" />
          </View>
        </View>
        <View style={styles.headerAside}>
          <SkeletonBlock height={34} width={112} />
          <SkeletonBlock height={14} width={76} />
        </View>
      </View>

      <View style={styles.metaGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.metaCell}>
            <SkeletonBlock height={12} width="54%" />
            <SkeletonBlock height={16} width="80%" />
            <SkeletonBlock height={12} width="62%" />
          </View>
        ))}
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} height={36} style={styles.progressCell} width="31%" />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.chatPanel}>
          <SkeletonBlock height={12} width="34%" />
          <SkeletonBlock height={14} width="92%" />
          <SkeletonBlock height={14} width="70%" />
        </View>
        <View style={styles.actions}>
          <SkeletonBlock height={44} width="100%" />
          <SkeletonBlock height={44} width="100%" />
        </View>
      </View>
    </Card>
  );
}

export function FranchiseeOrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <FranchiseeOrderCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function FranchiseeDashboardSkeleton() {
  return (
    <View style={styles.stack}>
      <Card padding="lg" style={styles.heroCard} variant="inverse">
        <SkeletonBlock height={12} width="28%" />
        <SkeletonBlock height={40} width="62%" />
        <SkeletonBlock height={16} width="72%" />
        <View style={styles.metricGrid}>
          {Array.from({ length: 2 }).map((_, index) => (
            <View key={index} style={styles.metricCardDark}>
              <SkeletonBlock height={12} width="48%" />
              <SkeletonBlock height={34} width="56%" />
              <SkeletonBlock height={12} width="74%" />
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.metricGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.metricCard}>
            <SkeletonBlock height={12} width="42%" />
            <SkeletonBlock height={34} width="58%" />
            <SkeletonBlock height={12} width="80%" />
          </View>
        ))}
      </View>

      <Card padding="lg">
        <View style={styles.progressRow}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} height={78} style={styles.progressCell} width="31%" />
          ))}
        </View>
      </Card>

      <FranchiseeOrdersSkeleton count={2} />
    </View>
  );
}

export function FranchiseeClientsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} padding="lg" style={styles.clientCard}>
          <SkeletonBlock height={12} width="24%" />
          <SkeletonBlock height={28} width="48%" />
          <SkeletonBlock height={14} width="40%" />
          <View style={styles.metaGrid}>
            {Array.from({ length: 4 }).map((__, metaIndex) => (
              <View key={metaIndex} style={styles.metaCell}>
                <SkeletonBlock height={12} width="48%" />
                <SkeletonBlock height={14} width="88%" />
                <SkeletonBlock height={12} width="60%" />
              </View>
            ))}
          </View>
          <View style={styles.inlineActions}>
            <SkeletonBlock height={44} width="48%" />
            <SkeletonBlock height={44} width="48%" />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.sm,
    minWidth: 172,
  },
  chatPanel: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  clientCard: {
    gap: theme.spacing.lg,
  },
  footer: {
    gap: theme.spacing.md,
  },
  headerAside: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    width: 112,
  },
  heroCard: {
    gap: theme.spacing.lg,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCell: {
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    minHeight: 88,
    padding: theme.spacing.md,
    width: '48.3%',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  metricCard: {
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    minHeight: 152,
    padding: theme.spacing.lg,
    width: '48.5%',
  },
  metricCardDark: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    minHeight: 128,
    padding: theme.spacing.lg,
    width: '48.5%',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  orderCard: {
    gap: theme.spacing.lg,
  },
  orderHeader: {
    gap: theme.spacing.md,
  },
  progressCell: {
    borderRadius: theme.borders.radius.sm,
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  stack: {
    gap: theme.spacing.lg,
  },
});
