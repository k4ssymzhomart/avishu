import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import {
  franchiseeFlowStages,
} from '@/lib/utils/franchisee';
import type { OrderChatThread } from '@/types/chat';
import type { Order } from '@/types/order';

type FranchiseeOrderCardProps = {
  actionLabel?: string;
  isBusy?: boolean;
  onActionPress?: () => void;
  onOpenChatPress?: () => void;
  order: Order;
  productImageUrl?: string | null;
  thread?: OrderChatThread | null;
};

function resolveStatusVariant(status: Order['status']) {
  if (status === 'placed' || status === 'out_for_delivery') {
    return styles.statusInverse;
  }

  if (status === 'accepted' || status === 'ready') {
    return styles.statusMuted;
  }

  if (status === 'delivered') {
    return styles.statusOutline;
  }

  return styles.statusDefault;
}

function resolveStatusLabelStyle(status: Order['status']) {
  if (status === 'placed' || status === 'out_for_delivery') {
    return styles.statusLabelInverse;
  }

  return null;
}

export function FranchiseeOrderCard({
  actionLabel,
  isBusy = false,
  onActionPress,
  onOpenChatPress,
  order,
  productImageUrl,
  thread,
}: FranchiseeOrderCardProps) {
  const { width } = useWindowDimensions();
  const {
    copy,
    getDeliveryLabel,
    getDestinationSnippet,
    getOrderTypeLabel,
    getStageMeta,
    getStatusLabel,
    getTimingLabel,
  } = useFranchiseeI18n();
  const isCompact = width < 720;
  const isWide = width >= 960;
  const timing = getTimingLabel(order);
  const isIncoming = order.status === 'placed';
  const currentStageIndex = franchiseeFlowStages.findIndex((stage) => stage.status === order.status);
  const unreadSupportCount = thread?.unreadCountForSupport ?? 0;

  return (
    <View style={[styles.card, order.status === 'ready' ? styles.cardReady : null]}>
      {isIncoming ? (
        <View style={styles.priorityRail}>
          <Text style={styles.priorityLabel}>{copy.orderCard.newIntake}</Text>
          <Text style={styles.priorityMeta}>{getStageMeta(order)}</Text>
        </View>
      ) : null}

      <View style={[styles.header, isWide ? styles.headerWide : null]}>
        <View style={styles.identityRow}>
          <View style={styles.imageFrame}>
            {productImageUrl ? (
              <Image resizeMode="cover" source={{ uri: productImageUrl }} style={styles.image} />
            ) : (
              <Text style={styles.imageFallback}>{order.productCollection ?? 'AVISHU'}</Text>
            )}
          </View>

          <View style={styles.identityCopy}>
            <Text style={styles.stageMeta}>{getStageMeta(order)}</Text>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <View style={styles.inlineMeta}>
              <Text style={styles.inlineMetaText}>{order.id}</Text>
              <Text style={styles.inlineMetaText}>{getOrderTypeLabel(order)}</Text>
              <Text style={styles.inlineMetaText}>{formatCurrency(order.productPrice)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerAside}>
          <View style={[styles.statusPill, resolveStatusVariant(order.status)]}>
            <Text style={[styles.statusLabel, resolveStatusLabelStyle(order.status)]}>{getStatusLabel(order.status)}</Text>
          </View>
          <Text style={styles.headerPrice}>{formatCurrency(order.productPrice)}</Text>
        </View>
      </View>

      <Divider />

      <View style={styles.metaGrid}>
        <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
          <Text style={styles.metaLabel}>{copy.orderCard.orderType}</Text>
          <Text style={styles.metaValue}>{getOrderTypeLabel(order)}</Text>
        </View>
        <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
          <Text style={styles.metaLabel}>{timing.label}</Text>
          <Text style={styles.metaValue}>{timing.value}</Text>
        </View>
        <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
          <Text style={styles.metaLabel}>{copy.orderCard.delivery}</Text>
          <Text style={styles.metaValue}>{getDeliveryLabel(order)}</Text>
        </View>
        <View style={[styles.metaCell, isCompact ? styles.metaCellCompact : null]}>
          <Text style={styles.metaLabel}>{copy.orderCard.destination}</Text>
          <Text numberOfLines={2} style={styles.metaValue}>
            {getDestinationSnippet(order)}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {franchiseeFlowStages.map((stage, index) => {
          const isCompletedStage = index <= currentStageIndex;
          const isCurrentStage = stage.status === order.status;

          return (
            <View
              key={stage.status}
              style={[
                styles.progressCell,
                isCompletedStage ? styles.progressCellComplete : null,
                isCurrentStage ? styles.progressCellCurrent : null,
              ]}
            >
              <Text
                style={[
                  styles.progressLabel,
                  isCompletedStage ? styles.progressLabelComplete : null,
                  isCurrentStage ? styles.progressLabelCurrent : null,
                ]}
              >
                {getStatusLabel(stage.status)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.footer, isWide ? styles.footerWide : null]}>
        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatLabel}>{copy.orderCard.chat}</Text>
            <Text style={[styles.chatBadge, unreadSupportCount ? styles.chatBadgeUnread : null]}>
              {unreadSupportCount ? `${unreadSupportCount} ${copy.common.unreadSuffix}` : copy.common.synced}
            </Text>
          </View>
          <Text numberOfLines={2} style={styles.chatPreview}>
            {thread?.lastMessageText ?? copy.orderCard.synced}
          </Text>
        </View>

        <View style={styles.actions}>
          {onOpenChatPress ? (
            <Button
              label={unreadSupportCount ? `${copy.common.openChat} (${unreadSupportCount})` : copy.common.openChat}
              onPress={onOpenChatPress}
              size="sm"
              variant={actionLabel ? 'ghost' : 'secondary'}
            />
          ) : null}
          {actionLabel && onActionPress ? (
            <Button
              disabled={isBusy}
              label={isBusy ? `${actionLabel}...` : actionLabel}
              onPress={onActionPress}
              size="sm"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.sm,
    minWidth: 172,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  cardReady: {
    backgroundColor: theme.colors.surface.muted,
  },
  chatBadge: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  chatBadgeUnread: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  chatHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  chatPanel: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.sm,
    minHeight: 88,
    padding: theme.spacing.md,
  },
  chatPreview: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  customerName: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  footer: {
    gap: theme.spacing.md,
  },
  footerWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  header: {
    gap: theme.spacing.md,
  },
  headerAside: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  headerPrice: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  headerWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  identityCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageFallback: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  imageFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    height: 110,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 88,
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
  metaCell: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    minHeight: 88,
    padding: theme.spacing.md,
    width: '48.3%',
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
  priorityLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  priorityMeta: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  priorityRail: {
    backgroundColor: theme.colors.surface.inverse,
    gap: theme.spacing.xs,
    marginHorizontal: -theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  productName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  progressCell: {
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    minHeight: 36,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  progressCellComplete: {
    backgroundColor: theme.colors.surface.muted,
  },
  progressCellCurrent: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  progressLabel: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  progressLabelComplete: {
    color: theme.colors.text.secondary,
  },
  progressLabelCurrent: {
    color: theme.colors.text.inverse,
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  stageMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  statusDefault: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
  },
  statusInverse: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  statusLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  statusLabelInverse: {
    color: theme.colors.text.inverse,
  },
  statusMuted: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
  },
  statusOutline: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.subtle,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
});
