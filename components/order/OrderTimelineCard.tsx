import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { theme } from '@/lib/theme/tokens';
import {
  formatCustomerStage,
  formatDateLabel,
  formatDeliveryMethod,
  formatOrderStatus,
  formatOrderType,
  formatRelativeTime,
} from '@/lib/utils/format';
import type { Order } from '@/types/order';

type OrderTimelineCardProps = {
  actionLabel?: string;
  context?: 'customer' | 'franchisee' | 'production';
  isBusy?: boolean;
  onActionPress?: () => void;
  onSecondaryActionPress?: () => void;
  order: Order;
  secondaryActionLabel?: string;
};

function resolveBadgeVariant(status: Order['status']) {
  if (status === 'delivered') {
    return 'outline' as const;
  }

  if (status === 'out_for_delivery' || status === 'ready') {
    return 'inverse' as const;
  }

  if (status === 'in_production') {
    return 'default' as const;
  }

  if (status === 'accepted') {
    return 'muted' as const;
  }

  return 'outline' as const;
}

function resolveNote(order: Order) {
  if (order.status === 'delivered') {
    return 'The order is complete and stored in delivery history.';
  }

  if (order.status === 'out_for_delivery') {
    return `Delivery is active via ${formatDeliveryMethod(order.delivery.method)}.`;
  }

  if (order.status === 'ready') {
    return 'The piece is prepared and awaiting handoff.';
  }

  if (order.preferredReadyDate) {
    return `Preferred readiness ${formatDateLabel(order.preferredReadyDate)}.`;
  }

  return 'Status updates are synced in real time across the AVISHU flow.';
}

export function OrderTimelineCard({
  actionLabel,
  context = 'customer',
  isBusy = false,
  onActionPress,
  onSecondaryActionPress,
  order,
  secondaryActionLabel,
}: OrderTimelineCardProps) {
  return (
    <Card padding="lg">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderTitle}>{order.productName}</Text>
          <Text style={styles.orderSubtitle}>
            {context === 'customer' ? `Stage ${formatCustomerStage(order.status)}` : order.customerName}
          </Text>
        </View>
        <Badge label={formatOrderStatus(order.status)} variant={resolveBadgeVariant(order.status)} />
      </View>

      <Divider />

      <View style={styles.metaGrid}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Type</Text>
          <Text style={styles.metaValue}>{formatOrderType(order.type)}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Updated</Text>
          <Text style={styles.metaValue}>{formatRelativeTime(order.updatedAt)}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Delivery</Text>
          <Text style={styles.metaValue}>{formatDeliveryMethod(order.delivery.method)}</Text>
        </View>
      </View>

      {context === 'customer' ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailValue}>{order.delivery.address ?? 'Address will be confirmed by boutique support.'}</Text>
          <Text style={styles.detailMeta}>
            {order.preferredReadyDate
              ? `Preferred date ${formatDateLabel(order.preferredReadyDate)}`
              : `Placed ${formatRelativeTime(order.createdAt)}`}
          </Text>
        </View>
      ) : null}

      <Text style={styles.note}>{resolveNote(order)}</Text>

      {actionLabel || secondaryActionLabel ? (
        <View style={styles.actions}>
          {secondaryActionLabel && onSecondaryActionPress ? (
            <Button
              disabled={isBusy}
              label={secondaryActionLabel}
              onPress={onSecondaryActionPress}
              size={context === 'production' ? 'md' : 'sm'}
              variant="secondary"
            />
          ) : null}
          {actionLabel && onActionPress ? (
            <Button
              disabled={isBusy}
              label={actionLabel}
              onPress={onActionPress}
              size={context === 'production' ? 'md' : 'sm'}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.sm,
  },
  detailBlock: {
    gap: theme.spacing.xs,
  },
  detailMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  note: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  orderId: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  orderSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  orderTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
