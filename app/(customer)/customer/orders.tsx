import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { CustomerOrderTracker } from '@/components/order/CustomerOrderTracker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomerOrders } from '@/hooks/useOrders';
import { customerBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import {
  formatCurrency,
  formatDateLabel,
  formatDeliveryMethod,
  formatOrderStatus,
  formatRelativeTime,
} from '@/lib/utils/format';
import { useSessionStore } from '@/store/session';
import type { Order, OrderStatus } from '@/types/order';

const orderSteps = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_production', label: 'In production' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function resolveStatusVariant(status: OrderStatus) {
  if (status === 'out_for_delivery' || status === 'ready') {
    return 'inverse' as const;
  }

  if (status === 'cancelled') {
    return 'outline' as const;
  }

  if (status === 'accepted' || status === 'in_production') {
    return 'muted' as const;
  }

  return 'outline' as const;
}

function resolveOrderNote(order: Order) {
  if (order.status === 'placed') {
    return 'Your order is recorded and waiting for boutique confirmation.';
  }

  if (order.status === 'accepted') {
    return 'Boutique support has accepted the request and is preparing the next handoff.';
  }

  if (order.status === 'in_production') {
    return order.productionNote ?? 'The atelier is working through production steps now.';
  }

  if (order.status === 'ready') {
    return 'Your piece is completed and prepared for pickup or courier handoff.';
  }

  if (order.status === 'out_for_delivery') {
    return order.delivery.note ?? 'Courier handoff is active and the final delivery window is underway.';
  }

  if (order.status === 'cancelled') {
    return 'This order was cancelled. Any follow-up details remain available in the support thread.';
  }

  return order.delivery.note ?? 'This order has been completed and archived to your history.';
}

function getLayout(width: number) {
  const isDesktop = width >= 1180;
  const isTablet = width >= 780;
  const maxContentWidth = width >= 1360 ? 1240 : width >= 1180 ? 1140 : width >= 780 ? 940 : undefined;
  const contentWidth = Math.min(width - theme.spacing.xl * 2, maxContentWidth ?? width - theme.spacing.xl * 2);
  const sectionGap = theme.spacing.lg;
  const columnCount = isDesktop ? 2 : 1;
  const cardWidth =
    columnCount > 1
      ? (contentWidth - sectionGap * (columnCount - 1)) / columnCount
      : contentWidth;

  return { cardWidth, columnCount, contentWidth, isDesktop, isTablet, maxContentWidth, sectionGap };
}

function OrderStageStrip({ status }: { status: OrderStatus }) {
  const activeIndex = orderSteps.findIndex((step) => step.key === status);

  return (
    <View style={styles.stageStrip}>
      {orderSteps.map((step, index) => {
        const isActive = index <= activeIndex;

        return (
          <View key={step.key} style={styles.stageItem}>
            <View style={[styles.stageDot, isActive ? styles.stageDotActive : null]} />
            <Text numberOfLines={1} style={[styles.stageLabel, isActive ? styles.stageLabelActive : null]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function OrderSurfaceCard({
  actionLabel,
  onActionPress,
  order,
  secondaryActionLabel,
  onSecondaryActionPress,
}: {
  actionLabel: string;
  onActionPress: () => void;
  order: Order;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}) {
  return (
    <Card padding="lg" style={styles.orderCard}>
      {order.productImageUrl ? (
        <View style={styles.orderImageWrap}>
          <Image resizeMode="cover" source={{ uri: order.productImageUrl }} style={styles.orderImage} />
        </View>
      ) : null}

      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderCopy}>
          <Text style={styles.orderEyebrow}>{order.id}</Text>
          <Text style={styles.orderTitle}>{order.productName}</Text>
          <Text style={styles.orderSubcopy}>{`${formatCurrency(order.productPrice)} / ${formatDeliveryMethod(order.delivery.method)}`}</Text>
        </View>
        <Badge label={formatOrderStatus(order.status)} variant={resolveStatusVariant(order.status)} />
      </View>

      <OrderStageStrip status={order.status} />

      <View style={styles.metaGrid}>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>Updated</Text>
          <Text style={styles.metaValue}>{formatRelativeTime(order.updatedAt)}</Text>
        </View>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>Delivery</Text>
          <Text style={styles.metaValue}>{formatDeliveryMethod(order.delivery.method)}</Text>
        </View>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>Ready target</Text>
          <Text style={styles.metaValue}>
            {order.preferredReadyDate ? formatDateLabel(order.preferredReadyDate) : 'Boutique confirmed'}
          </Text>
        </View>
      </View>

      <View style={styles.addressPanel}>
        <Text style={styles.metaLabel}>Address summary</Text>
        <Text style={styles.addressValue}>
          {order.delivery.address ?? 'Address will be confirmed in chat.'}
        </Text>
      </View>

      <Text style={styles.note}>{resolveOrderNote(order)}</Text>

      <View style={styles.orderActions}>
        {secondaryActionLabel && onSecondaryActionPress ? (
          <Button label={secondaryActionLabel} onPress={onSecondaryActionPress} size="sm" variant="secondary" />
        ) : null}
        <Button label={actionLabel} onPress={onActionPress} size="sm" />
      </View>
    </Card>
  );
}

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { activeOrders, isLoading, orderHistory } = useCustomerOrders(currentUserId);
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getLayout(width), [width]);

  const leadOrder = activeOrders[0];
  const deliveredValue = orderHistory.reduce((sum, order) => sum + order.productPrice, 0);

  return (
    <Screen
      footer={<RoleBottomNav activeKey="orders" items={customerBottomNav} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <View style={[styles.header, layout.isDesktop ? styles.headerWide : null]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AVISHU / ORDERS</Text>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>
            Track active pieces, delivery summaries, and your completed archive from one calm screen.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{activeOrders.length}</Text>
            <Text style={styles.summaryLabel}>Active orders</Text>
          </Card>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{orderHistory.length}</Text>
            <Text style={styles.summaryLabel}>Delivered pieces</Text>
          </Card>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{formatCurrency(deliveredValue)}</Text>
            <Text style={styles.summaryLabel}>Archive value</Text>
          </Card>
        </View>
      </View>

      {isLoading ? (
        <LoadingState label="Loading orders" />
      ) : (
        <>
          {leadOrder ? (
            <View style={[styles.spotlightRow, layout.isDesktop ? styles.spotlightRowWide : null]}>
              <Card padding="lg" style={styles.spotlightCard}>
                {leadOrder.productImageUrl ? (
                  <View style={styles.spotlightImageWrap}>
                    <Image
                      resizeMode="cover"
                      source={{ uri: leadOrder.productImageUrl }}
                      style={styles.spotlightImage}
                    />
                  </View>
                ) : null}

                <Text style={styles.sectionEyebrow}>Current order</Text>
                <Text style={styles.spotlightTitle}>{leadOrder.productName}</Text>
                <Text style={styles.spotlightBody}>
                  {`${formatCurrency(leadOrder.productPrice)} / ${formatDeliveryMethod(leadOrder.delivery.method)} / updated ${formatRelativeTime(leadOrder.updatedAt)}`}
                </Text>

                <CustomerOrderTracker status={leadOrder.status} />

                <View style={styles.spotlightDetailRow}>
                  <View style={styles.spotlightMetaBlock}>
                    <Text style={styles.metaLabel}>Delivery method</Text>
                    <Text style={styles.metaValue}>{formatDeliveryMethod(leadOrder.delivery.method)}</Text>
                  </View>
                  <View style={styles.spotlightMetaBlock}>
                    <Text style={styles.metaLabel}>Address</Text>
                    <Text style={styles.metaValue}>
                      {leadOrder.delivery.address ?? 'Address shared in support thread'}
                    </Text>
                  </View>
                </View>

                <View style={styles.spotlightActions}>
                  <Button label="Open support" onPress={() => router.push(`/customer/chat/${leadOrder.id}`)} size="sm" />
                  <Button
                    label="View all"
                    onPress={() => router.push('/customer/orders')}
                    size="sm"
                    variant="secondary"
                  />
                </View>
              </Card>

              <Card padding="lg" style={styles.sidePanel} variant="muted">
                <Text style={styles.sectionEyebrow}>Delivery note</Text>
                <Text style={styles.sidePanelTitle}>{formatOrderStatus(leadOrder.status)}</Text>
                <Text style={styles.sidePanelBody}>{resolveOrderNote(leadOrder)}</Text>

                <View style={styles.sidePanelList}>
                  <View style={styles.sidePanelRow}>
                    <AssetIcon color={theme.colors.text.primary} name="packed" size={16} />
                    <Text style={styles.sidePanelMeta}>Order {leadOrder.id}</Text>
                  </View>
                  <View style={styles.sidePanelRow}>
                    <AssetIcon color={theme.colors.text.primary} name="alarm" size={16} />
                    <Text style={styles.sidePanelMeta}>Updated {formatRelativeTime(leadOrder.updatedAt)}</Text>
                  </View>
                  <View style={styles.sidePanelRow}>
                    <AssetIcon color={theme.colors.text.primary} name="message" size={16} />
                    <Text style={styles.sidePanelMeta}>Support thread stays tied to this order only</Text>
                  </View>
                </View>
              </Card>
            </View>
          ) : (
            <EmptyState
              description="Your future purchases and preorders will appear here with delivery tracking as soon as you place them."
              title="No orders yet"
            />
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Active</Text>
                <Text style={styles.sectionTitle}>Live orders</Text>
              </View>
              <Text style={styles.sectionMeta}>{activeOrders.length} open</Text>
            </View>

            {activeOrders.length ? (
              <View style={[styles.cardGrid, { gap: layout.sectionGap }]}>
                {activeOrders.map((order) => (
                  <View key={order.id} style={{ width: layout.cardWidth }}>
                    <OrderSurfaceCard
                      actionLabel="Open support"
                      onActionPress={() => router.push(`/customer/chat/${order.id}`)}
                      order={order}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                description="Placed and in-progress orders will surface here the moment they enter the customer flow."
                title="No active orders"
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>History</Text>
                <Text style={styles.sectionTitle}>Order archive</Text>
              </View>
              <Text style={styles.sectionMeta}>{orderHistory.length} archived</Text>
            </View>

            {orderHistory.length ? (
              <View style={[styles.cardGrid, { gap: layout.sectionGap }]}>
                {orderHistory.map((order) => (
                  <View key={order.id} style={{ width: layout.cardWidth }}>
                    <OrderSurfaceCard
                      actionLabel="View thread"
                      onActionPress={() => router.push(`/customer/chat/${order.id}`)}
                      order={order}
                      secondaryActionLabel="Revisit"
                      onSecondaryActionPress={() => router.push(`/customer/product/${order.productId}`)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                description="Delivered or cancelled orders will be archived here with their final notes and support history."
                title="No archive yet"
              />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addressPanel: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: 18,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  addressValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  header: {
    gap: theme.spacing.xl,
  },
  headerCopy: {
    gap: theme.spacing.sm,
    maxWidth: 660,
  },
  headerWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  orderImage: {
    height: '100%',
    width: '100%',
  },
  orderImageWrap: {
    backgroundColor: theme.colors.surface.muted,
    height: 188,
    overflow: 'hidden',
  },
  metaLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaTile: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: 18,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 140,
    padding: theme.spacing.md,
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  note: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  orderCard: {
    borderRadius: 24,
    gap: theme.spacing.lg,
    minHeight: 1,
  },
  orderEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  orderHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  orderHeaderCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  orderSubcopy: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  orderTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  section: {
    gap: theme.spacing.lg,
  },
  sectionEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  sidePanel: {
    borderRadius: 24,
    gap: theme.spacing.lg,
  },
  sidePanelBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sidePanelList: {
    gap: theme.spacing.md,
  },
  sidePanelMeta: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sidePanelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sidePanelTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  spotlightActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  spotlightBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  spotlightCard: {
    borderRadius: 24,
    flex: 1.3,
    gap: theme.spacing.lg,
  },
  spotlightDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  spotlightImage: {
    height: '100%',
    width: '100%',
  },
  spotlightImageWrap: {
    backgroundColor: theme.colors.surface.muted,
    height: 260,
    overflow: 'hidden',
  },
  spotlightMetaBlock: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: 18,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 180,
    padding: theme.spacing.md,
  },
  spotlightRow: {
    gap: theme.spacing.lg,
  },
  spotlightRowWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  spotlightTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  stageDot: {
    backgroundColor: theme.colors.border.subtle,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  stageDotActive: {
    backgroundColor: theme.colors.surface.inverse,
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 64,
  },
  stageLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    letterSpacing: theme.typography.tracking.wide,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stageLabelActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
  stageStrip: {
    alignItems: 'flex-start',
    borderColor: theme.colors.border.subtle,
    borderRadius: 18,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 560,
  },
  summaryCard: {
    borderRadius: 22,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 150,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    maxWidth: 440,
  },
  summaryValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 28,
    lineHeight: 34,
  },
});
