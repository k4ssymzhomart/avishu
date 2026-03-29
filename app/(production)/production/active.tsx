import { useState } from 'react';

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

export default function ProductionActiveScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { activeTasks, completeTask, isLoading, isStatusUpdating, nextActiveTask, productionUser } = useProductionWorkspace();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWide = width >= 1080;

  const handleCompleteTask = async (orderId: string) => {
    setErrorMessage(null);

    try {
      await completeTask(orderId);
    } catch {
      setErrorMessage('Completion did not reach the shared order stream. Check Firestore or demo mode.');
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="active" items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1240}
      scroll
    >
      <AppHeader
        eyebrow="AVISHU / PRODUCTION"
        subtitle={
          productionUser
            ? `${productionUser.productionUnitName} keeps live floor work visible until each garment is completed and handed to the ready board.`
            : 'A floor-first view for garments already in work, with direct completion controls and minimal noise.'
        }
        title="Active"
      />

      <View style={[styles.hero, isWide ? styles.heroWide : null]}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Live floor work</Text>
          <Text style={styles.heroTitle}>Every active garment stays visible until production marks it complete.</Text>
          <Text style={styles.heroBody}>
            {nextActiveTask
              ? `Closest target: ${nextActiveTask.dueValue}.`
              : 'Started tasks stay here automatically until they move into the ready board.'}
          </Text>
        </View>

        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricLabel}>On the floor</Text>
          <Text style={styles.heroMetricValue}>{activeTasks.length.toString().padStart(2, '0')}</Text>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorEyebrow}>Sync note</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading && activeTasks.length === 0 ? (
        <ProductionBoardSkeleton count={2} />
      ) : activeTasks.length ? (
        <View style={[styles.grid, isWide ? styles.gridWide : null]}>
          {activeTasks.map((task) => (
            <View key={task.id} style={[styles.gridItem, isWide ? styles.gridItemWide : null]}>
              <ProductionTaskCard
                actionLabel="Complete task"
                isBusy={isStatusUpdating(task.id)}
                onActionPress={() => {
                  void handleCompleteTask(task.id);
                }}
                onOpenTaskPress={() => router.push(`/production/task/${task.id}`)}
                task={task}
              />
            </View>
          ))}
        </View>
      ) : (
        <ProductionBoardEmptyState
          description="The active board fills the moment an accepted task is started from the queue."
          title="No active tasks"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  errorEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  errorText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
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
