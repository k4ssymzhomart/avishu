import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProductionBoardEmptyState } from '@/components/production/ProductionBoardEmptyState';
import { ProductionBoardSkeleton } from '@/components/production/ProductionBoardSkeleton';
import { ProductionTaskCard } from '@/components/production/ProductionTaskCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { useProductionWorkspace } from '@/hooks/useProductionWorkspace';
import { productionBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';

export default function ProductionReadyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isLoading, latestReadyTask, productionUser, readyTasks } = useProductionWorkspace();

  const isWide = width >= 1080;

  return (
    <Screen
      footer={<RoleBottomNav activeKey="ready" items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1240}
      scroll
    >
      <AppHeader
        eyebrow="AVISHU / PRODUCTION"
        subtitle={
          productionUser
            ? `${productionUser.productionUnitName} collects finished garments here until franchisee handoff and the next delivery step.`
            : 'Finished garments wait here for franchisee handoff and the next delivery step.'
        }
        title="Ready"
      />

      <View style={[styles.hero, isWide ? styles.heroWide : null]}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Completed pieces</Text>
          <Text style={styles.heroTitle}>These garments are finished and ready to move forward.</Text>
          <Text style={styles.heroBody}>
            {latestReadyTask
              ? `Latest completion: ${latestReadyTask.stageMeta}.`
              : 'Completed work stays here until the franchisee takes over handoff or delivery.'}
          </Text>
        </View>

        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricLabel}>Ready now</Text>
          <Text style={styles.heroMetricValue}>{readyTasks.length.toString().padStart(2, '0')}</Text>
        </View>
      </View>

      {isLoading && readyTasks.length === 0 ? (
        <ProductionBoardSkeleton count={2} />
      ) : readyTasks.length ? (
        <View style={[styles.grid, isWide ? styles.gridWide : null]}>
          {readyTasks.map((task) => (
            <View key={task.id} style={[styles.gridItem, isWide ? styles.gridItemWide : null]}>
              <ProductionTaskCard
                onOpenTaskPress={() => router.push(`/production/task/${task.id}`)}
                openTaskLabel="View task"
                task={task}
              />
            </View>
          ))}
        </View>
      ) : (
        <ProductionBoardEmptyState
          description="Completed production items will collect here automatically once the workshop marks them ready."
          title="Nothing ready yet"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: theme.spacing.lg,
  },
  gridItem: {
    width: '100%',
  },
  gridItemWide: {
    width: '48.7%',
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hero: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  heroBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 520,
  },
  heroCopy: {
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetric: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    maxWidth: 188,
    padding: theme.spacing.lg,
  },
  heroMetricLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetricValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.display,
    lineHeight: theme.typography.lineHeight.display,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    maxWidth: 620,
  },
  heroWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
