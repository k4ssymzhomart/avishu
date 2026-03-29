import { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { CustomerOrderTracker } from '@/components/order/CustomerOrderTracker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useCustomerOrders } from '@/hooks/useOrders';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { updateOrderStatus } from '@/services/orders';
import { useSessionStore } from '@/store/session';
import type { Order, OrderStatus } from '@/types/order';

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

function getLayout(width: number) {
  const isDesktop = width >= 1180;
  const maxContentWidth = width >= 1360 ? 1240 : width >= 1180 ? 1140 : width >= 780 ? 940 : undefined;
  const contentWidth = Math.min(width - theme.spacing.xl * 2, maxContentWidth ?? width - theme.spacing.xl * 2);
  const sectionGap = theme.spacing.lg;
  const columnCount = isDesktop ? 2 : 1;
  const cardWidth =
    columnCount > 1
      ? (contentWidth - sectionGap * (columnCount - 1)) / columnCount
      : contentWidth;

  return { cardWidth, isDesktop, maxContentWidth, sectionGap };
}

function OrderSurfaceCard({
  actionLabel,
  addressFallback,
  formatDateLabel,
  formatDeliveryMethodLabel,
  formatOrderNote,
  formatOrderStatusLabel,
  formatRelativeLabel,
  isSecondaryDisabled = false,
  noteLabel,
  onActionPress,
  onSecondaryActionPress,
  order,
  secondaryActionLabel,
  statusLanguage,
  uiCopy,
}: {
  actionLabel: string;
  addressFallback: string;
  formatDateLabel: (value?: string | null, withYear?: boolean) => string;
  formatDeliveryMethodLabel: (method: Order['delivery']['method']) => string;
  formatOrderNote: (status: OrderStatus, productionNote?: string | null, deliveryNote?: string | null) => string;
  formatOrderStatusLabel: (status: OrderStatus) => string;
  formatRelativeLabel: (value: string) => string;
  isSecondaryDisabled?: boolean;
  noteLabel: string;
  onActionPress: () => void;
  onSecondaryActionPress?: () => void;
  order: Order;
  secondaryActionLabel?: string;
  statusLanguage: 'en' | 'ru';
  uiCopy: {
    addressSummary: string;
    delivery: string;
    readyFallback: string;
    readyTarget: string;
    updated: string;
  };
}) {
  const readyTarget =
    order.preferredReadyDate ? formatDateLabel(order.preferredReadyDate, true) : uiCopy.readyFallback;

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
          <Text style={styles.orderSubcopy}>
            {`${formatCurrency(order.productPrice)} / ${formatDeliveryMethodLabel(order.delivery.method)}`}
          </Text>
        </View>
        <Badge label={formatOrderStatusLabel(order.status)} variant={resolveStatusVariant(order.status)} />
      </View>

      <CustomerOrderTracker language={statusLanguage} status={order.status} />

      <View style={styles.metaGrid}>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>{uiCopy.updated}</Text>
          <Text style={styles.metaValue}>{formatRelativeLabel(order.updatedAt)}</Text>
        </View>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>{uiCopy.delivery}</Text>
          <Text style={styles.metaValue}>{formatDeliveryMethodLabel(order.delivery.method)}</Text>
        </View>
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>{uiCopy.readyTarget}</Text>
          <Text style={styles.metaValue}>{readyTarget}</Text>
        </View>
      </View>

      <View style={styles.addressPanel}>
        <Text style={styles.metaLabel}>{uiCopy.addressSummary}</Text>
        <Text style={styles.addressValue}>{order.delivery.address ?? addressFallback}</Text>
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.metaLabel}>{noteLabel}</Text>
        <Text style={styles.note}>
          {formatOrderNote(order.status, order.productionNote, order.delivery.note)}
        </Text>
      </View>

      <View style={styles.orderActions}>
        {secondaryActionLabel && onSecondaryActionPress ? (
          <Button
            disabled={isSecondaryDisabled}
            label={secondaryActionLabel}
            onPress={onSecondaryActionPress}
            size="sm"
            variant="secondary"
          />
        ) : null}
        <Button label={actionLabel} onPress={onActionPress} size="sm" />
      </View>
    </Card>
  );
}

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const { copy, formatDateLabel, formatDeliveryMethodLabel, formatOrderNote, formatOrderStatusLabel, formatRelativeLabel, language, navItems } =
    useCustomerI18n();
  const { activeOrders, isLoading, orderHistory } = useCustomerOrders(currentUserId);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getLayout(width), [width]);
  const deliveredValue = orderHistory.reduce((sum, order) => sum + order.productPrice, 0);
  const hasOrders = activeOrders.length > 0 || orderHistory.length > 0;

  const handleCancelOrder = async (orderId: string) => {
    if (!currentUserId || cancellingOrderId === orderId) {
      return;
    }

    setCancellingOrderId(orderId);

    try {
      await updateOrderStatus(orderId, 'cancelled', {
        senderId: currentUserId,
        senderName: currentUserName ?? (language === 'ru' ? 'Клиент' : 'Customer'),
        senderRole: 'customer',
      });
    } finally {
      setCancellingOrderId((current) => (current === orderId ? null : current));
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="orders" items={navItems} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <View style={[styles.header, layout.isDesktop ? styles.headerWide : null]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{language === 'ru' ? 'AVISHU / ЗАКАЗЫ' : 'AVISHU / ORDERS'}</Text>
          <Text style={styles.title}>{copy.orders.ordersTitle}</Text>
          <Text style={styles.subtitle}>{copy.orders.subtitle}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{activeOrders.length}</Text>
            <Text style={styles.summaryLabel}>{copy.orders.activeLabel}</Text>
          </Card>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{orderHistory.length}</Text>
            <Text style={styles.summaryLabel}>{language === 'ru' ? 'В архиве' : 'Archived orders'}</Text>
          </Card>
          <Card padding="lg" style={styles.summaryCard} variant="muted">
            <Text style={styles.summaryValue}>{formatCurrency(deliveredValue)}</Text>
            <Text style={styles.summaryLabel}>{copy.orders.archiveLabel}</Text>
          </Card>
        </View>
      </View>

      {isLoading ? (
        <LoadingState label={copy.orders.loading} />
      ) : !hasOrders ? (
        <EmptyState description={copy.orders.emptyDescription} title={copy.orders.emptyTitle} />
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>{copy.orders.activeEyebrow}</Text>
                <Text style={styles.sectionTitle}>{copy.orders.liveTitle}</Text>
              </View>
              <Text style={styles.sectionMeta}>{`${activeOrders.length} ${copy.orders.openMeta}`}</Text>
            </View>

            {activeOrders.length ? (
              <View style={[styles.cardGrid, { gap: layout.sectionGap }]}>
                {activeOrders.map((order) => (
                  <View key={order.id} style={{ width: layout.cardWidth }}>
                    <OrderSurfaceCard
                      actionLabel={copy.orders.actionOpenSupport}
                      addressFallback={copy.orders.addressFallback}
                      formatDateLabel={formatDateLabel}
                      formatDeliveryMethodLabel={formatDeliveryMethodLabel}
                      formatOrderNote={formatOrderNote}
                      formatOrderStatusLabel={formatOrderStatusLabel}
                      formatRelativeLabel={formatRelativeLabel}
                      isSecondaryDisabled={cancellingOrderId === order.id}
                      noteLabel={language === 'ru' ? 'Статус' : 'Status'}
                      onActionPress={() => router.push(`/customer/chat/${order.id}`)}
                      onSecondaryActionPress={() => void handleCancelOrder(order.id)}
                      order={order}
                      secondaryActionLabel={
                        cancellingOrderId === order.id ? copy.orders.actionCancelling : copy.orders.actionCancel
                      }
                      statusLanguage={language}
                      uiCopy={{
                        addressSummary: copy.orders.addressSummary,
                        delivery: copy.orders.delivery,
                        readyFallback: copy.orders.readyConfirmed,
                        readyTarget: copy.orders.readyTarget,
                        updated: copy.orders.updated,
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                description={language === 'ru'
                  ? 'Как только заказ перейдет в активный поток, он появится здесь.'
                  : 'Placed and in-progress orders will surface here the moment they enter the customer flow.'}
                title={language === 'ru' ? 'Активных заказов нет' : 'No active orders'}
              />
            )}
          </View>

          {orderHistory.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>{copy.orders.archiveEyebrow}</Text>
                  <Text style={styles.sectionTitle}>{copy.orders.historyTitle}</Text>
                </View>
                <Text style={styles.sectionMeta}>{`${orderHistory.length} ${copy.orders.archivedMeta}`}</Text>
              </View>

              <View style={[styles.cardGrid, { gap: layout.sectionGap }]}>
                {orderHistory.map((order) => (
                  <View key={order.id} style={{ width: layout.cardWidth }}>
                    <OrderSurfaceCard
                      actionLabel={copy.orders.actionViewThread}
                      addressFallback={copy.orders.addressFallback}
                      formatDateLabel={formatDateLabel}
                      formatDeliveryMethodLabel={formatDeliveryMethodLabel}
                      formatOrderNote={formatOrderNote}
                      formatOrderStatusLabel={formatOrderStatusLabel}
                      formatRelativeLabel={formatRelativeLabel}
                      noteLabel={language === 'ru' ? 'Итог' : 'Final note'}
                      onActionPress={() => router.push(`/customer/chat/${order.id}`)}
                      onSecondaryActionPress={() => router.push(`/customer/product/${order.productId}`)}
                      order={order}
                      secondaryActionLabel={copy.orders.actionRevisit}
                      statusLanguage={language}
                      uiCopy={{
                        addressSummary: copy.orders.addressSummary,
                        delivery: copy.orders.delivery,
                        readyFallback: copy.orders.readyConfirmed,
                        readyTarget: copy.orders.readyTarget,
                        updated: copy.orders.updated,
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
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
  notePanel: {
    gap: theme.spacing.xs,
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
  orderImage: {
    height: '100%',
    width: '100%',
  },
  orderImageWrap: {
    backgroundColor: theme.colors.surface.muted,
    height: 188,
    overflow: 'hidden',
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
