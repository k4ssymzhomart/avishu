import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import type { OrderChatThread } from '@/types/chat';
import type { Order } from '@/types/order';
import type { Product } from '@/types/product';

type FranchiseeOrdersLedgerProps = {
  isBusyOrderId?: string | null;
  orders: Order[];
  onOpenChat: (orderId: string) => void;
  onStatusAction: (orderId: string) => void;
  productById: Map<string, Product>;
  threadByOrderId: Map<string, OrderChatThread>;
};

function getRowStatusTone(status: Order['status']) {
  if (status === 'placed') {
    return styles.statusPlaced;
  }

  if (status === 'ready' || status === 'out_for_delivery') {
    return styles.statusEmphasis;
  }

  if (status === 'delivered') {
    return styles.statusDelivered;
  }

  return styles.statusDefault;
}

export function FranchiseeOrdersLedger({
  isBusyOrderId,
  orders,
  onOpenChat,
  onStatusAction,
  productById,
  threadByOrderId,
}: FranchiseeOrdersLedgerProps) {
  const { width } = useWindowDimensions();
  const { copy, getActionLabel, getDeliveryLabel, getDestinationSnippet, getOrderTypeLabel, getStatusLabel, getTimingLabel } =
    useFranchiseeI18n();
  const isWide = width >= 980;
  const isTablet = width >= 720;

  if (!orders.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{copy.orders.noOrdersTitle}</Text>
        <Text style={styles.emptyBody}>{copy.orders.noOrdersDescription}</Text>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>{copy.orders.compactHint}</Text>
        <Text style={styles.title}>{copy.orders.title}</Text>
      </View>

      <View style={styles.table}>
        {isWide ? (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerLabel, styles.productCell]}>{copy.orders.productColumn}</Text>
              <Text style={[styles.headerLabel, styles.timingCell]}>{copy.orders.scheduleColumn}</Text>
              <Text style={[styles.headerLabel, styles.routeCell]}>{copy.orders.routeColumn}</Text>
              <Text style={[styles.headerLabel, styles.supportCell]}>{copy.orders.supportColumn}</Text>
              <Text style={[styles.headerLabel, styles.statusCell]}>{copy.orders.statusColumn}</Text>
              <Text style={[styles.headerLabel, styles.actionCell]}>{copy.orders.actionColumn}</Text>
            </View>
            <Divider />
          </>
        ) : null}

        {orders.map((order, index) => {
          const timing = getTimingLabel(order);
          const thread = threadByOrderId.get(order.id);
          const actionLabel = getActionLabel(order.status);
          const unreadSupportCount = thread?.unreadCountForSupport ?? 0;
          const productImage = order.productImageUrl ?? productById.get(order.productId)?.imageUrl ?? null;

          return (
            <View key={order.id}>
              {index ? <Divider /> : null}
              <View style={[styles.row, isWide ? styles.rowWide : null]}>
                <View style={[styles.productCell, styles.productCellBlock]}>
                  <View style={styles.identityRow}>
                    <View style={styles.imageFrame}>
                      {productImage ? (
                        <Image resizeMode="cover" source={{ uri: productImage }} style={styles.image} />
                      ) : (
                        <Text style={styles.imageFallback}>{order.productCollection ?? 'AVISHU'}</Text>
                      )}
                    </View>

                    <View style={styles.identityCopy}>
                      <Text style={styles.primaryLine}>{order.productName}</Text>
                      <Text style={styles.secondaryLine}>{order.customerName}</Text>
                      <View style={styles.inlineMeta}>
                        <Text style={styles.inlineMetaText}>{order.id}</Text>
                        <Text style={styles.inlineMetaText}>{getOrderTypeLabel(order)}</Text>
                        <Text style={styles.inlineMetaText}>{formatCurrency(order.productPrice)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.timingCell, styles.metaBlock, isWide ? null : styles.metaBlockCompact]}>
                  <Text style={styles.metaLabel}>{timing.label}</Text>
                  <Text style={styles.metaValue}>{timing.value}</Text>
                </View>

                <View style={[styles.routeCell, styles.metaBlock, isWide ? null : styles.metaBlockCompact]}>
                  <Text style={styles.metaLabel}>{copy.orderCard.delivery}</Text>
                  <Text style={styles.metaValue}>{getDeliveryLabel(order)}</Text>
                  <Text numberOfLines={1} style={styles.metaSubtle}>
                    {getDestinationSnippet(order)}
                  </Text>
                </View>

                <View style={[styles.supportCell, styles.metaBlock, isWide ? null : styles.metaBlockCompact]}>
                  <Text style={styles.metaLabel}>{copy.orderCard.chat}</Text>
                  <Text numberOfLines={1} style={styles.metaValue}>
                    {thread?.lastMessageText ?? copy.orderCard.synced}
                  </Text>
                  <Text style={styles.metaSubtle}>
                    {unreadSupportCount ? `${unreadSupportCount} ${copy.common.unreadSuffix}` : copy.common.synced}
                  </Text>
                </View>

                <View style={[styles.statusCell, styles.statusBlock]}>
                  <View style={[styles.statusPill, getRowStatusTone(order.status)]}>
                    <Text style={[styles.statusLabel, order.status === 'placed' ? styles.statusLabelInverse : null]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.actionCell, styles.actionBlock, isWide ? null : styles.actionBlockCompact]}>
                  <Pressable onPress={() => onOpenChat(order.id)} style={({ pressed }) => [styles.chatLink, pressed ? styles.chatLinkPressed : null]}>
                    <Text style={styles.chatLinkLabel}>
                      {unreadSupportCount ? `${copy.common.openChat} (${unreadSupportCount})` : copy.common.openChat}
                    </Text>
                  </Pressable>
                  {actionLabel ? (
                    <Button
                      disabled={isBusyOrderId === order.id}
                      label={isBusyOrderId === order.id ? `${actionLabel}...` : actionLabel}
                      onPress={() => onStatusAction(order.id)}
                      size="sm"
                    />
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBlock: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  actionBlockCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCell: {
    flex: 1.15,
  },
  chatLink: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: theme.borders.width.thin,
    minHeight: 32,
    justifyContent: 'center',
  },
  chatLinkLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  chatLinkPressed: {
    opacity: 0.74,
  },
  emptyBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 440,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  headerBlock: {
    gap: theme.spacing.xs,
  },
  headerLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  identityRow: {
    alignItems: 'center',
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
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 54,
  },
  inlineMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  inlineMetaText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  metaBlock: {
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  metaBlockCompact: {
    width: '47.5%',
  },
  metaLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaSubtle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  primaryLine: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  productCell: {
    flex: 2.75,
  },
  productCellBlock: {
    justifyContent: 'center',
  },
  routeCell: {
    flex: 1.55,
  },
  row: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  rowWide: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  secondaryLine: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  shell: {
    gap: theme.spacing.lg,
  },
  statusBlock: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statusCell: {
    flex: 1.1,
  },
  statusDefault: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
  },
  statusDelivered: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
  },
  statusEmphasis: {
    backgroundColor: theme.colors.surface.muted,
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
  statusPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusPlaced: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  supportCell: {
    flex: 1.35,
  },
  table: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.lg,
  },
  timingCell: {
    flex: 1.1,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
});
