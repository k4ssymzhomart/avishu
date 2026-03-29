import { useEffect, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';
import { Keyboard, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'react-native';

import { ProductionBoardEmptyState } from '@/components/production/ProductionBoardEmptyState';
import { ProductionBoardSkeleton } from '@/components/production/ProductionBoardSkeleton';
import { ProductionHeaderNotificationAction } from '@/components/production/ProductionHeaderNotificationAction';
import { ProductionStageBadge } from '@/components/production/ProductionStageBadge';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useProductionWorkspace } from '@/hooks/useProductionWorkspace';
import { productionBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import { formatOrderType, formatRelativeTime } from '@/lib/utils/format';
import {
  getProductionDeliveryLabel,
  getProductionTaskAction,
} from '@/lib/utils/production';

const noteTemplates = [
  { label: 'TAILORING', prefix: 'Tailoring note: ' },
  { label: 'STITCHING', prefix: 'Stitching note: ' },
  { label: 'FINISHING', prefix: 'Finishing note: ' },
] as const;

function DetailStat({
  label,
  value,
  style,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
  value: string;
}) {
  return (
    <View style={[styles.detailStat, style]}>
      <Text style={styles.detailStatLabel}>{label}</Text>
      <Text style={styles.detailStatValue}>{value}</Text>
    </View>
  );
}

export default function ProductionTaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { allTasks, completeTask, isLoading, isNoteSaving, isStatusUpdating, saveTaskNote, startTask } = useProductionWorkspace();
  const [noteDraft, setNoteDraft] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const task = allTasks.find((entry) => entry.id === id);
  const noteSaving = task ? isNoteSaving(task.id) : false;
  const statusUpdating = task ? isStatusUpdating(task.id) : false;

  useEffect(() => {
    if (!task) {
      return;
    }

    setNoteDraft(task.order.productionNote ?? '');
  }, [task?.id, task?.order.productionNoteUpdatedAt]);

  const isWide = width >= 980;

  if (isLoading && !task) {
    return (
      <Screen
        footer={<RoleBottomNav activeKey="queue" items={productionBottomNav} variant="floating" />}
        footerMaxWidth={560}
        footerMode="floating"
        maxContentWidth={1240}
        scroll
      >
        <AppHeader
          actionSlot={<ProductionHeaderNotificationAction />}
          eyebrow="AVISHU / PRODUCTION"
          onBackPress={() => router.back()}
          showBackButton
          title="Task"
        />
        <ProductionBoardSkeleton count={1} />
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen
        footer={<RoleBottomNav activeKey="queue" items={productionBottomNav} variant="floating" />}
        footerMaxWidth={560}
        footerMode="floating"
        maxContentWidth={1240}
        scroll
      >
        <AppHeader
          actionSlot={<ProductionHeaderNotificationAction />}
          eyebrow="AVISHU / PRODUCTION"
          onBackPress={() => router.back()}
          showBackButton
          title="Task"
        />
        <ProductionBoardEmptyState
          description="This garment is no longer on the current production board."
          title="Task not found"
        />
      </Screen>
    );
  }

  const taskAction = getProductionTaskAction(task.order.status);
  const isNoteDirty = noteDraft.trim() !== (task.order.productionNote ?? '').trim();
  const actionMeta =
    task.order.status === 'accepted'
      ? 'Moves the garment onto the active floor board and updates the shared customer timeline immediately.'
      : task.order.status === 'in_production'
        ? 'Marks the garment complete and shifts it into the ready handoff board immediately.'
        : 'This garment is finished and already visible in the shared ready state.';

  const handleSaveNote = async () => {
    if (!isNoteDirty) {
      return;
    }

    setNoteError(null);

    try {
      await saveTaskNote(task.id, noteDraft);
      Keyboard.dismiss();
    } catch {
      setNoteError('Internal note was not saved. Check Firestore access and workshop sync.');
    }
  };

  const handleStatusUpdate = async () => {
    if (!taskAction) {
      return;
    }

    setStatusError(null);

    try {
      if (taskAction.nextStatus === 'in_production') {
        await startTask(task.id);
      } else {
        await completeTask(task.id);
      }
    } catch {
      setStatusError('Status change did not sync to the shared order stream. Check Firestore access and order routing.');
    }
  };

  const applyNoteTemplate = (prefix: string) => {
    setNoteDraft((current) => {
      const trimmed = current.trim();

      if (!trimmed.length) {
        return prefix;
      }

      if (trimmed.startsWith(prefix)) {
        return current;
      }

      return `${prefix}${trimmed}`;
    });
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey={task.boardKey} items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1240}
      scroll
    >
      <AppHeader
        actionSlot={<ProductionHeaderNotificationAction />}
        eyebrow="AVISHU / PRODUCTION"
        onBackPress={() => router.back()}
        showBackButton
        subtitle={`${task.id} / ${task.branchLabel}`}
        title="Task detail"
      />

      <View style={[styles.hero, isWide ? styles.heroWide : null]}>
        <View style={[styles.imagePanel, isWide ? styles.imagePanelWide : null]}>
          {task.productImageUrl ? (
            <Image resizeMode="cover" source={{ uri: task.productImageUrl }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackLabel}>{task.imageFallbackLabel}</Text>
            </View>
          )}

          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayLabel}>{task.order.productCollection ?? 'AVISHU'}</Text>
            <Text style={styles.imageOverlayMeta}>{task.id}</Text>
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroStatusRow}>
            <Text style={styles.heroEyebrow}>Workshop task</Text>
            <ProductionStageBadge status={task.order.status} />
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{task.order.productName}</Text>
            <Text style={styles.heroCustomer}>{task.order.customerName}</Text>
          </View>

          <View style={styles.inlineMeta}>
            <Text style={styles.inlineMetaText}>{task.branchLabel}</Text>
            <Text style={styles.inlineMetaText}>{formatOrderType(task.order.type)}</Text>
            <Text style={styles.inlineMetaText}>{task.id}</Text>
          </View>

          <View style={styles.heroMetaGrid}>
            <DetailStat label={task.dueLabel} value={task.dueValue} />
            <DetailStat label="Delivery" value={getProductionDeliveryLabel(task.order)} />
            <DetailStat label="Priority" value={task.priorityLabel} />
            <DetailStat label="Current stage" value={task.stageMeta} />
            <DetailStat
              label="Internal note"
              style={styles.detailStatFull}
              value={task.order.productionNote ?? 'No internal note yet'}
            />
          </View>
        </View>
      </View>

      <Card padding="lg" variant="inverse">
        <Text style={styles.actionEyebrow}>Status action</Text>
        <Text style={styles.actionTitle}>{taskAction ? taskAction.label : 'Ready for handoff'}</Text>
        <Text style={styles.actionBody}>{actionMeta}</Text>

        {statusError ? <Text style={styles.errorTextInverse}>{statusError}</Text> : null}

        {taskAction ? (
          <Button
            disabled={statusUpdating}
            label={statusUpdating ? `${taskAction.label}...` : taskAction.label}
            onPress={() => {
              void handleStatusUpdate();
            }}
            style={styles.primaryActionButton}
            variant="secondary"
          />
        ) : (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>
              {task.order.timeline.readyAt
                ? `Completed ${formatRelativeTime(task.order.timeline.readyAt)}`
                : 'Completed'}
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.detailGrid}>
        <DetailStat label="Customer" value={task.order.customerName} />
        <DetailStat label="Workshop" value={task.branchLabel} />
        <DetailStat label="Order type" value={formatOrderType(task.order.type)} />
        <DetailStat label={task.dueLabel} value={task.dueValue} />
      </View>

      <Card padding="lg">
        <View style={styles.noteHeader}>
          <Text style={styles.noteEyebrow}>Internal note</Text>
          <Text style={styles.noteMeta}>
            {task.order.productionNoteUpdatedAt
              ? `Saved ${formatRelativeTime(task.order.productionNoteUpdatedAt)}`
              : 'Internal only'}
          </Text>
        </View>

        <View style={styles.notePresetRow}>
          {noteTemplates.map((template) => (
            <Pressable
              key={template.label}
              onPress={() => applyNoteTemplate(template.prefix)}
              style={({ pressed }) => [styles.notePreset, pressed ? styles.notePresetPressed : null]}
            >
              <Text style={styles.notePresetLabel}>{template.label}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Workshop note"
          multiline
          onChangeText={setNoteDraft}
          placeholder="Sizing, tailoring, stitching, finishing"
          style={styles.noteInput}
          value={noteDraft}
        />

        {noteError ? <Text style={styles.errorText}>{noteError}</Text> : null}

        <Button
          disabled={!isNoteDirty || noteSaving}
          label={noteSaving ? 'Saving note...' : 'Save note'}
          onPress={() => {
            void handleSaveNote();
          }}
          variant={isNoteDirty ? 'secondary' : 'ghost'}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 560,
  },
  actionEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  actionTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    width: '100%',
  },
  detailStat: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flexBasis: '48.5%',
    flexGrow: 1,
    gap: theme.spacing.xs,
    minHeight: 88,
    minWidth: 0,
    padding: theme.spacing.md,
  },
  detailStatFull: {
    flexBasis: '100%',
    width: '100%',
  },
  detailStatLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailStatValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  errorTextInverse: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  hero: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    gap: theme.spacing.lg,
    minWidth: 0,
    padding: theme.spacing.lg,
  },
  heroCopy: {
    gap: theme.spacing.xs,
  },
  heroCustomer: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  heroEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    width: '100%',
  },
  heroStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
  },
  heroWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  imageFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  imageFallbackLabel: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    letterSpacing: theme.typography.tracking.widest,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  imageOverlay: {
    backgroundColor: 'rgba(17,17,17,0.76)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  imageOverlayLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  imageOverlayMeta: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  imagePanel: {
    backgroundColor: theme.colors.surface.muted,
    minHeight: 340,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePanelWide: {
    minHeight: 0,
    width: '42%',
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
  noteEyebrow: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  noteHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteInput: {
    minHeight: 142,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  noteMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  notePreset: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  notePresetLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  notePresetPressed: {
    opacity: 0.82,
  },
  notePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  primaryActionButton: {
    marginTop: theme.spacing.xs,
  },
  readyBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  readyBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
