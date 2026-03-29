import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ProductionStageBadge } from '@/components/production/ProductionStageBadge';
import type { ProductionTask } from '@/hooks/useProductionWorkspace';
import { theme } from '@/lib/theme/tokens';
import { formatOrderType } from '@/lib/utils/format';
import { formatProductionStage } from '@/lib/utils/production';

type ProductionTaskCardProps = {
  actionLabel?: string;
  isBusy?: boolean;
  onActionPress?: () => void;
  onOpenTaskPress: () => void;
  openTaskLabel?: string;
  task: ProductionTask;
};

function getRailLabel(status: ProductionTask['order']['status']) {
  if (status === 'accepted') {
    return 'Queued task';
  }

  if (status === 'in_production') {
    return 'On the floor';
  }

  return 'Ready for handoff';
}

export function ProductionTaskCard({
  actionLabel,
  isBusy = false,
  onActionPress,
  onOpenTaskPress,
  openTaskLabel = 'Task details',
  task,
}: ProductionTaskCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 540;
  const isWide = width >= 920;
  const hasPrimaryAction = Boolean(actionLabel && onActionPress);

  return (
    <View
      style={[
        styles.card,
        task.order.status === 'in_production' ? styles.cardActive : null,
        task.order.status === 'ready' ? styles.cardReady : null,
      ]}
    >
      <View
        style={[
          styles.stateRail,
          task.order.status === 'in_production' ? styles.stateRailInverse : null,
        ]}
      >
        <Text
          style={[
            styles.stateRailLabel,
            task.order.status === 'in_production' ? styles.stateRailLabelInverse : null,
          ]}
        >
          {getRailLabel(task.order.status)}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.stateRailMeta,
            task.order.status === 'in_production' ? styles.stateRailMetaInverse : null,
          ]}
        >
          {task.stageMeta}
        </Text>
      </View>

      <View style={[styles.main, isWide ? styles.mainWide : null]}>
        <View style={[styles.imageFrame, isWide ? styles.imageFrameWide : null]}>
          {task.productImageUrl ? (
            <Image resizeMode="cover" source={{ uri: task.productImageUrl }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackLabel}>{task.imageFallbackLabel}</Text>
            </View>
          )}

          <View style={styles.imageFooter}>
            <Text numberOfLines={1} style={styles.imageFooterLabel}>
              {task.order.productCollection ?? 'AVISHU'}
            </Text>
            <Text numberOfLines={1} style={styles.imageFooterMeta}>
              {task.id}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <View style={styles.signalRow}>
                <Text numberOfLines={1} style={styles.stageMeta}>
                  {task.stageMeta}
                </Text>
                <View
                  style={[
                    styles.priorityPill,
                    task.priorityTone === 'critical' ? styles.priorityPillCritical : null,
                    task.priorityTone === 'neutral' ? styles.priorityPillNeutral : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityLabel,
                      task.priorityTone === 'critical' ? styles.priorityLabelCritical : null,
                    ]}
                  >
                    {task.priorityLabel}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.productName}>
                {task.order.productName}
              </Text>
              <Text numberOfLines={1} style={styles.customerName}>
                {task.order.customerName}
              </Text>
            </View>

            <ProductionStageBadge status={task.order.status} />
          </View>

          <View style={styles.inlineMeta}>
            <Text style={styles.inlineMetaText}>{task.branchLabel}</Text>
            <Text style={styles.inlineMetaText}>{task.id}</Text>
            <Text style={styles.inlineMetaText}>{formatProductionStage(task.order.status)}</Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
              <Text style={styles.metaLabel}>{task.dueLabel}</Text>
              <Text numberOfLines={2} style={styles.metaValue}>
                {task.dueValue}
              </Text>
            </View>

            <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
              <Text style={styles.metaLabel}>Order type</Text>
              <Text style={styles.metaValue}>{formatOrderType(task.order.type)}</Text>
            </View>

            <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
              <Text style={styles.metaLabel}>Workshop</Text>
              <Text numberOfLines={2} style={styles.metaValue}>
                {task.branchLabel}
              </Text>
            </View>

            <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
              <Text style={styles.metaLabel}>Current stage</Text>
              <Text style={styles.metaValue}>{formatProductionStage(task.order.status)}</Text>
            </View>
          </View>

          {task.order.productionNote ? (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>Internal note</Text>
              <Text numberOfLines={2} style={styles.noteText}>
                {task.order.productionNote}
              </Text>
            </View>
          ) : null}

          <View style={[styles.actions, hasPrimaryAction && isWide ? styles.actionsWide : null]}>
            {hasPrimaryAction ? (
              <Button
                disabled={isBusy}
                label={isBusy ? `${actionLabel}...` : actionLabel ?? ''}
                onPress={onActionPress}
                style={styles.actionButton}
              />
            ) : null}

            <Button
              label={openTaskLabel}
              onPress={onOpenTaskPress}
              style={styles.actionButton}
              variant={hasPrimaryAction ? 'secondary' : 'primary'}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  actionsWide: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
  },
  cardActive: {
    backgroundColor: theme.colors.surface.default,
  },
  cardReady: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
  },
  content: {
    flex: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  customerName: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  header: {
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  imageFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  imageFallbackLabel: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    letterSpacing: theme.typography.tracking.widest,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  imageFooter: {
    backgroundColor: 'rgba(17,17,17,0.78)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  imageFooterLabel: {
    color: theme.colors.text.inverse,
    flex: 1,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  imageFooterMeta: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    marginLeft: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  imageFrame: {
    backgroundColor: theme.colors.surface.muted,
    minHeight: 224,
    overflow: 'hidden',
    position: 'relative',
  },
  imageFrameWide: {
    maxWidth: 244,
    minHeight: 0,
    width: '34%',
  },
  inlineMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  inlineMetaText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  main: {
    gap: 0,
  },
  mainWide: {
    flexDirection: 'row',
  },
  metaCell: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    minHeight: 84,
    padding: theme.spacing.md,
    width: '48.6%',
  },
  metaCellCompact: {
    width: '100%',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  noteBlock: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  noteLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  noteText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  productName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  priorityLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  priorityLabelCritical: {
    color: theme.colors.text.inverse,
  },
  priorityPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 26,
    paddingHorizontal: theme.spacing.sm,
  },
  priorityPillCritical: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  priorityPillNeutral: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
  },
  signalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stageMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  stateRail: {
    backgroundColor: theme.colors.surface.muted,
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  stateRailInverse: {
    backgroundColor: theme.colors.surface.inverse,
    borderBottomColor: theme.colors.border.strong,
  },
  stateRailLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  stateRailLabelInverse: {
    color: theme.colors.text.inverse,
  },
  stateRailMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  stateRailMetaInverse: {
    color: theme.colors.text.inverseMuted,
  },
});
