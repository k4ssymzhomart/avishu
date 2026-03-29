import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProductionBoardEmptyState } from '@/components/production/ProductionBoardEmptyState';
import { ProductionHeaderNotificationAction } from '@/components/production/ProductionHeaderNotificationAction';
import { ProductionStageBadge } from '@/components/production/ProductionStageBadge';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProductionUnit } from '@/hooks/useProductionUnits';
import { useProductionWorkspace } from '@/hooks/useProductionWorkspace';
import { productionBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';

type TaskGroup = {
  key: 'new' | 'active' | 'ready';
  label: string;
  tasks: ReturnType<typeof useProductionWorkspace>['allTasks'];
};

function QueueRow({
  isSelected,
  onPress,
  task,
}: {
  isSelected: boolean;
  onPress: () => void;
  task: ReturnType<typeof useProductionWorkspace>['allTasks'][number];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.queueRow,
        isSelected ? styles.queueRowActive : null,
        pressed ? styles.queueRowPressed : null,
      ]}
    >
      <View style={styles.queueImageFrame}>
        {task.productImageUrl ? (
          <Image resizeMode="cover" source={{ uri: task.productImageUrl }} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.queueImageFallback}>
            <Text style={styles.queueImageFallbackLabel}>{task.imageFallbackLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.queueCopy}>
        <Text numberOfLines={2} style={[styles.queueTitle, isSelected ? styles.queueTitleActive : null]}>
          {task.order.productName}
        </Text>
        <Text numberOfLines={1} style={[styles.queueMeta, isSelected ? styles.queueMetaActive : null]}>
          {task.order.selectedSize ?? 'NO SIZE'} / {task.branchLabel}
        </Text>
        <Text numberOfLines={1} style={[styles.queueDue, isSelected ? styles.queueDueActive : null]}>
          {task.dueValue}
        </Text>
      </View>

      <ProductionStageBadge status={task.order.status} />
    </Pressable>
  );
}

export default function ProductionQueueScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    acceptedTasks,
    activeTasks,
    allTasks,
    completeTask,
    isLoading,
    isStatusUpdating,
    latestReadyTask,
    nextAcceptedTask,
    nextActiveTask,
    productionUser,
    readyTasks,
    startTask,
  } = useProductionWorkspace();
  const { productionUnit } = useProductionUnit(productionUser?.productionUnitId ?? null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isTablet = width >= 900;

  useEffect(() => {
    const preferredTaskId =
      selectedTaskId && allTasks.some((task) => task.id === selectedTaskId)
        ? selectedTaskId
        : nextAcceptedTask?.id ?? nextActiveTask?.id ?? latestReadyTask?.id ?? null;

    setSelectedTaskId(preferredTaskId);
  }, [allTasks, latestReadyTask?.id, nextAcceptedTask?.id, nextActiveTask?.id, selectedTaskId]);

  const selectedTask = useMemo(
    () => allTasks.find((task) => task.id === selectedTaskId) ?? null,
    [allTasks, selectedTaskId],
  );

  const groups: TaskGroup[] = [
    { key: 'new', label: 'NEW', tasks: acceptedTasks },
    { key: 'active', label: 'IN PRODUCTION', tasks: activeTasks },
    { key: 'ready', label: 'READY', tasks: readyTasks },
  ];

  const handlePrimaryAction = async () => {
    if (!selectedTask) {
      return;
    }

    setErrorMessage(null);

    try {
      if (selectedTask.order.status === 'accepted') {
        await startTask(selectedTask.id);
        return;
      }

      if (selectedTask.order.status === 'in_production') {
        await completeTask(selectedTask.id);
      }
    } catch {
      setErrorMessage('The workshop update did not reach Firestore. Check routing and permissions, then try again.');
    }
  };

  const primaryActionLabel =
    selectedTask?.order.status === 'accepted'
      ? 'START'
      : selectedTask?.order.status === 'in_production'
        ? 'COMPLETE'
        : null;

  return (
    <Screen
      footer={<RoleBottomNav activeKey="queue" items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1400}
      scroll={!isTablet}
    >
      <AppHeader
        actionSlot={<ProductionHeaderNotificationAction />}
        eyebrow="AVISHU / PRODUCTION"
        subtitle={
          productionUnit
            ? `${productionUnit.name} is linked to ${productionUnit.linkedFranchises.length} franchise route(s) and currently holds ${productionUnit.activeTasks} active task(s).`
            : 'Workshop queue routed by production unit with live order status and no hardcoded task feed.'
        }
        title="Workshop board"
      />

      <View style={styles.metricStrip}>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Unit</Text>
          <Text style={styles.metricValue}>{productionUnit?.name ?? productionUser?.productionUnitName ?? 'AVISHU Atelier'}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Workers</Text>
          <Text style={styles.metricValue}>{productionUnit?.workersCount ?? 0}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>New</Text>
          <Text style={styles.metricValue}>{acceptedTasks.length}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Active</Text>
          <Text style={styles.metricValue}>{activeTasks.length}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Ready</Text>
          <Text style={styles.metricValue}>{readyTasks.length}</Text>
        </View>
      </View>

      {isLoading && !allTasks.length ? (
        <ProductionBoardEmptyState
          description="The production unit is connected. Tasks will populate here in real time as soon as orders are routed into the workshop."
          title="Loading workshop board"
        />
      ) : !allTasks.length ? (
        <ProductionBoardEmptyState
          description="No routed tasks are waiting in this production unit right now."
          title="Board is clear"
        />
      ) : (
        <View style={[styles.boardShell, isTablet ? styles.boardShellTablet : null]}>
          <ScrollView
            contentContainerStyle={styles.queuePanelContent}
            showsVerticalScrollIndicator={false}
            style={styles.queuePanel}
          >
            {groups.map((group) => (
              <View key={group.key} style={styles.groupBlock}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupCount}>{group.tasks.length.toString().padStart(2, '0')}</Text>
                </View>

                {group.tasks.length ? (
                  <View style={styles.groupList}>
                    {group.tasks.map((task) => (
                      <QueueRow
                        isSelected={task.id === selectedTaskId}
                        key={task.id}
                        onPress={() => setSelectedTaskId(task.id)}
                        task={task}
                      />
                    ))}
                  </View>
                ) : (
                  <Card padding="md" variant="muted">
                    <Text style={styles.emptyGroupText}>No tasks</Text>
                  </Card>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.detailPanel}>
            {selectedTask ? (
              <>
                <Card padding="lg" variant="inverse" style={styles.detailHero}>
                  <View style={styles.detailHeroHeader}>
                    <Text style={styles.detailEyebrow}>{selectedTask.branchLabel}</Text>
                    <ProductionStageBadge status={selectedTask.order.status} />
                  </View>

                  <Text style={styles.detailTitle}>{selectedTask.order.productName}</Text>

                  <View style={styles.detailMetaGrid}>
                    <View style={styles.detailMetaCell}>
                      <Text style={styles.detailMetaLabel}>SIZE</Text>
                      <Text style={styles.detailMetaValue}>{selectedTask.order.selectedSize ?? 'NO SIZE'}</Text>
                    </View>
                    <View style={styles.detailMetaCell}>
                      <Text style={styles.detailMetaLabel}>DUE</Text>
                      <Text style={styles.detailMetaValue}>{selectedTask.dueValue}</Text>
                    </View>
                    <View style={styles.detailMetaCell}>
                      <Text style={styles.detailMetaLabel}>STATUS</Text>
                      <Text style={styles.detailMetaValue}>{selectedTask.stageMeta}</Text>
                    </View>
                  </View>
                </Card>

                <View style={styles.detailContent}>
                  <View style={styles.detailImagePanel}>
                    {selectedTask.productImageUrl ? (
                      <Image resizeMode="cover" source={{ uri: selectedTask.productImageUrl }} style={styles.detailImage} />
                    ) : (
                      <View style={styles.detailImageFallback}>
                        <Text style={styles.detailImageFallbackLabel}>{selectedTask.imageFallbackLabel}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionPanel}>
                    <Text style={styles.actionLabel}>Current route</Text>
                    <Text style={styles.actionValue}>{selectedTask.branchLabel}</Text>
                    <Text style={styles.actionSubtle}>
                      {selectedTask.order.productionUnitName ?? productionUnit?.name ?? 'Production unit linked'}
                    </Text>

                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    {primaryActionLabel ? (
                      <Button
                        disabled={isStatusUpdating(selectedTask.id)}
                        label={isStatusUpdating(selectedTask.id) ? `${primaryActionLabel}...` : primaryActionLabel}
                        onPress={() => {
                          void handlePrimaryAction();
                        }}
                        style={styles.primaryActionButton}
                      />
                    ) : (
                      <View style={styles.readyBadge}>
                        <Text style={styles.readyBadgeText}>READY FOR HANDOFF</Text>
                      </View>
                    )}

                    <Button
                      label="OPEN TASK"
                      onPress={() => router.push(`/production/task/${selectedTask.id}`)}
                      style={styles.secondaryActionButton}
                      variant="secondary"
                    />
                  </View>
                </View>
              </>
            ) : (
              <ProductionBoardEmptyState
                description="Select a task from the queue to see the full operational detail."
                title="Select a task"
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  actionPanel: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  actionSubtle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  actionValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  boardShell: {
    gap: theme.spacing.xl,
  },
  boardShellTablet: {
    alignItems: 'stretch',
    flexDirection: 'row',
    minHeight: 780,
  },
  detailContent: {
    gap: theme.spacing.lg,
  },
  detailEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailHero: {
    gap: theme.spacing.lg,
  },
  detailHeroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailImage: {
    height: '100%',
    width: '100%',
  },
  detailImageFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailImageFallbackLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailImagePanel: {
    aspectRatio: 4 / 5,
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
  },
  detailMetaCell: {
    gap: 4,
    minWidth: 120,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  detailMetaLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailMetaValue: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.lg,
  },
  detailPanel: {
    flex: 1.12,
    gap: theme.spacing.lg,
  },
  detailTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: 40,
    lineHeight: 44,
  },
  emptyGroupText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  groupBlock: {
    gap: theme.spacing.md,
  },
  groupCount: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupList: {
    gap: theme.spacing.sm,
  },
  groupTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metricCell: {
    flex: 1,
    gap: 4,
    minWidth: 120,
    padding: theme.spacing.lg,
  },
  metricLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metricStrip: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  metricValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  primaryActionButton: {
    minHeight: 78,
  },
  queueCopy: {
    flex: 1,
    gap: 2,
  },
  queueDue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  queueDueActive: {
    color: theme.colors.text.inverse,
  },
  queueImageFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  queueImageFallbackLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  queueImageFrame: {
    backgroundColor: theme.colors.surface.muted,
    height: 84,
    overflow: 'hidden',
    width: 68,
  },
  queueMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  queueMetaActive: {
    color: theme.colors.text.inverseMuted,
  },
  queuePanel: {
    flex: 0.88,
  },
  queuePanelContent: {
    gap: theme.spacing.xl,
  },
  queueRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 110,
    padding: theme.spacing.md,
  },
  queueRowActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  queueRowPressed: {
    opacity: 0.9,
  },
  queueTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  queueTitleActive: {
    color: theme.colors.text.inverse,
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 78,
  },
  readyBadgeText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  secondaryActionButton: {
    minHeight: 68,
  },
});
