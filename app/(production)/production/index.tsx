import { useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProductionBoardEmptyState } from '@/components/production/ProductionBoardEmptyState';
import { ProductionBoardSkeleton } from '@/components/production/ProductionBoardSkeleton';
import { ProductionSampleOrderPanel } from '@/components/production/ProductionSampleOrderPanel';
import { ProductionTaskCard } from '@/components/production/ProductionTaskCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { useProductionWorkspace } from '@/hooks/useProductionWorkspace';
import { useProducts } from '@/hooks/useProducts';
import { productionBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';

function LaneHeader({
  title,
  description,
  count,
}: {
  title: string;
  description: string;
  count: number;
}) {
  return (
    <View style={styles.laneHeader}>
      <View style={styles.laneHeaderCopy}>
        <Text style={styles.laneTitle}>{title}</Text>
        <Text style={styles.laneDescription}>{description}</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeLabel}>{count.toString().padStart(2, '0')}</Text>
      </View>
    </View>
  );
}

export default function ProductionQueueScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { products } = useProducts();
  const {
    acceptedTasks,
    activeTasks,
    isLoading,
    isStatusUpdating,
    nextAcceptedTask,
    productionUser,
    readyTasks,
    startTask,
  } = useProductionWorkspace();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWide = width >= 1080;

  const handleStartProduction = async (orderId: string) => {
    setErrorMessage(null);

    try {
      await startTask(orderId);
    } catch {
      setErrorMessage('Live sync paused before the task reached the floor. Check Firestore or demo mode.');
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="queue" items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1240}
      scroll
    >
      <AppHeader
        eyebrow="AVISHU / PRODUCTION"
        subtitle={
          productionUser
            ? `${productionUser.productionUnitName} receives boutique-approved tasks in real time and pushes status straight back into the shared order flow.`
            : 'The workshop queue shows boutique-approved garments the moment they arrive and pushes status back into the shared order flow.'
        }
        title="Queue"
      />

      <View style={styles.hero}>
        <View style={[styles.heroTopRow, isWide ? styles.heroTopRowWide : null]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Realtime workshop board</Text>
            <Text style={styles.heroTitle}>Boutique approvals become workshop tasks the moment they are accepted.</Text>
            <Text style={styles.heroBody}>
              {nextAcceptedTask
                ? `Next intake: ${nextAcceptedTask.order.productName} for ${nextAcceptedTask.order.customerName}.`
                : 'The next boutique-approved piece appears here automatically without a refresh.'}
            </Text>
          </View>

          <View style={styles.heroMetricStrip}>
            <View style={styles.heroMetricCell}>
              <Text style={styles.heroMetricLabel}>Queued</Text>
              <Text style={styles.heroMetricValue}>{acceptedTasks.length.toString().padStart(2, '0')}</Text>
            </View>
            <View style={styles.heroMetricCell}>
              <Text style={styles.heroMetricLabel}>Active</Text>
              <Text style={styles.heroMetricValue}>{activeTasks.length.toString().padStart(2, '0')}</Text>
            </View>
            <View style={styles.heroMetricCell}>
              <Text style={styles.heroMetricLabel}>Ready</Text>
              <Text style={styles.heroMetricValue}>{readyTasks.length.toString().padStart(2, '0')}</Text>
            </View>
          </View>
        </View>

      </View>
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorEyebrow}>Sync note</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading && acceptedTasks.length === 0 && activeTasks.length === 0 ? (
        <ProductionBoardSkeleton count={2} />
      ) : (
        <View style={[styles.boardGrid, isWide ? styles.boardGridWide : null]}>
          <View style={styles.lane}>
            <LaneHeader
              count={acceptedTasks.length}
              description="Newly queued garments waiting for a workshop operator to begin."
              title="New / queued"
            />

            {acceptedTasks.length ? (
              <View style={styles.taskList}>
                {acceptedTasks.map((task) => (
                  <ProductionTaskCard
                    actionLabel="Start production"
                    isBusy={isStatusUpdating(task.id)}
                    key={task.id}
                    onActionPress={() => {
                      void handleStartProduction(task.id);
                    }}
                    onOpenTaskPress={() => router.push(`/production/task/${task.id}`)}
                    task={task}
                  />
                ))}
              </View>
            ) : (
              <ProductionBoardEmptyState
                description="New boutique-approved garments will appear here in real time as soon as they are accepted."
                title="No accepted tasks"
              />
            )}
          </View>

          <View style={styles.lane}>
            <LaneHeader
              count={activeTasks.length}
              description="Garments already on the floor and moving through active production."
              title="Active / floor"
            />

            {activeTasks.length ? (
              <View style={styles.taskList}>
                {activeTasks.map((task) => (
                  <ProductionTaskCard
                    key={task.id}
                    onOpenTaskPress={() => router.push(`/production/task/${task.id}`)}
                    task={task}
                  />
                ))}
              </View>
            ) : (
              <ProductionBoardEmptyState
                description="Once a workshop operator starts a task, it shifts here automatically and stays visible until completion."
                title="Floor is clear"
              />
            )}
          </View>
        </View>
      )}

      <ProductionSampleOrderPanel products={products} />

    </Screen>
  );
}

const styles = StyleSheet.create({
  boardGrid: {
    gap: theme.spacing.xl,
  },
  boardGridWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  countBadge: {
    alignItems: 'center',
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: theme.spacing.md,
  },
  countBadgeLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
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
  hero: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  heroBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 520,
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetricCell: {
    gap: theme.spacing.xs,
    minWidth: 88,
  },
  heroMetricLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetricStrip: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    minWidth: 248,
    padding: theme.spacing.lg,
  },
  heroMetricValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    maxWidth: 580,
  },
  heroTopRow: {
    gap: theme.spacing.lg,
  },
  heroTopRowWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lane: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  laneDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 340,
  },
  laneHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  laneHeaderCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  laneTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  taskList: {
    gap: theme.spacing.lg,
  },
});
