import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { theme } from '@/lib/theme/tokens';
import type { OrderChatThread } from '@/types/chat';
import type { Order } from '@/types/order';

type FranchiseeClientCardProps = {
  activeOrder?: Order | null;
  latestOrder: Order;
  name: string;
  onOpenChatPress?: () => void;
  onOpenOrderPress: () => void;
  phoneNumber?: string | null;
  thread?: OrderChatThread | null;
};

export function FranchiseeClientCard({
  activeOrder,
  latestOrder,
  name,
  onOpenChatPress,
  onOpenOrderPress,
  phoneNumber,
  thread,
}: FranchiseeClientCardProps) {
  const { width } = useWindowDimensions();
  const { copy, formatRelativeLabel, getDeliveryLabel, getDestinationSnippet, getStatusLabel } = useFranchiseeI18n();
  const isCompact = width < 720;
  const order = activeOrder ?? latestOrder;
  const unreadSupportCount = thread?.unreadCountForSupport ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{copy.clients.title}</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{phoneNumber ?? copy.clients.phonePending}</Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusLabel}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <Divider />

      <View style={styles.detailGrid}>
        <View style={[styles.detailCell, isCompact ? styles.detailCellCompact : null]}>
          <Text style={styles.detailLabel}>{copy.clients.latestOrder}</Text>
          <Text style={styles.detailValue}>{order.productName}</Text>
          <Text style={styles.detailMeta}>{order.id}</Text>
        </View>
        <View style={[styles.detailCell, isCompact ? styles.detailCellCompact : null]}>
          <Text style={styles.detailLabel}>{copy.clients.lastMovement}</Text>
          <Text style={styles.detailValue}>{formatRelativeLabel(order.updatedAt)}</Text>
          <Text style={styles.detailMeta}>{getDeliveryLabel(order)}</Text>
        </View>
        <View style={[styles.detailCell, isCompact ? styles.detailCellCompact : null]}>
          <Text style={styles.detailLabel}>{copy.orderCard.destination}</Text>
          <Text numberOfLines={2} style={styles.detailValue}>
            {getDestinationSnippet(order)}
          </Text>
        </View>
        <View style={[styles.detailCell, isCompact ? styles.detailCellCompact : null]}>
          <Text style={styles.detailLabel}>{copy.orders.support}</Text>
          <Text numberOfLines={2} style={styles.detailValue}>
            {thread?.lastMessageText ?? copy.common.synced}
          </Text>
          <Text style={styles.detailMeta}>
            {unreadSupportCount ? `${unreadSupportCount} ${copy.common.unreadSuffix}` : copy.common.synced}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label={copy.common.openOrder} onPress={onOpenOrderPress} size="sm" variant="secondary" />
        {onOpenChatPress ? <Button label={copy.common.openChat} onPress={onOpenChatPress} size="sm" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  detailCell: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    minHeight: 88,
    padding: theme.spacing.md,
    width: '48.3%',
  },
  detailCellCompact: {
    width: '100%',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  meta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  name: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  statusLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
});
