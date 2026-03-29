import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FranchiseeBranchMap } from '@/components/franchisee/FranchiseeBranchMap';
import { FranchiseeFlowStrip } from '@/components/franchisee/FranchiseeFlowStrip';
import { FranchiseeLaneSection } from '@/components/franchisee/FranchiseeLaneSection';
import { FranchiseeMetricTile } from '@/components/franchisee/FranchiseeMetricTile';
import { FranchiseeOrderCard } from '@/components/franchisee/FranchiseeOrderCard';
import { FranchiseeDashboardSkeleton } from '@/components/franchisee/FranchiseeSkeletons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeChatThreads } from '@/hooks/useChat';
import { useFranchiseeBottomNav } from '@/hooks/useFranchiseeBottomNav';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { useFranchiseeWorkspace } from '@/hooks/useFranchiseeWorkspace';
import { useFranchiseeOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import {
  applyFranchiseeOptimisticStatus,
  calculateFranchiseeDashboardMetrics,
  franchiseePlanTarget,
  getFranchiseeFlowCounts,
  getFranchiseeOrderAction,
  getFranchiseeUnreadSupportCount,
} from '@/lib/utils/franchisee';
import { updateOrderStatus } from '@/services/orders';

export default function FranchiseeDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const workspace = useFranchiseeWorkspace();
  const { copy, getActionLabel } = useFranchiseeI18n();
  const bottomNavItems = useFranchiseeBottomNav();
  const scope = useMemo(
    () =>
      workspace.userId
        ? {
            branchId: workspace.branchId ?? null,
            franchiseId: workspace.franchiseId,
          }
        : null,
    [workspace.branchId, workspace.franchiseId, workspace.userId],
  );
  const { isLoading, orders } = useFranchiseeOrders(scope);
  const { products } = useProducts();
  const { threads } = useFranchiseeChatThreads(scope);
  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayOrders = useMemo(
    () =>
      orders.map((order) =>
        optimisticStatuses[order.id]
          ? applyFranchiseeOptimisticStatus(order, optimisticStatuses[order.id] as typeof order.status)
          : order,
      ),
    [optimisticStatuses, orders],
  );

  useEffect(() => {
    setOptimisticStatuses((current) => {
      const nextEntries = Object.entries(current).filter(([orderId, status]) => {
        const liveOrder = orders.find((order) => order.id === orderId);
        return liveOrder && liveOrder.status !== status;
      });

      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
  }, [orders]);

  const metrics = useMemo(() => calculateFranchiseeDashboardMetrics(displayOrders), [displayOrders]);
  const flowCounts = useMemo(() => getFranchiseeFlowCounts(displayOrders), [displayOrders]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const threadByOrderId = useMemo(() => new Map(threads.map((thread) => [thread.orderId, thread])), [threads]);
  const unreadSupportCount = getFranchiseeUnreadSupportCount(threads);
  const incomingOrders = displayOrders.filter((order) => order.status === 'placed').slice(0, 2);
  const isCompact = width < 720;
  const isWide = width >= 980;
  const isDashboardLoading = isLoading && !orders.length;

  const handleStatusUpdate = async (orderId: string) => {
    const order = displayOrders.find((entry) => entry.id === orderId);
    const action = order ? getFranchiseeOrderAction(order.status) : null;

    if (!action) {
      return;
    }

    setMutatingOrderId(orderId);
    setErrorMessage(null);
    setOptimisticStatuses((current) => ({
      ...current,
      [orderId]: action.nextStatus,
    }));

    try {
      await updateOrderStatus(orderId, action.nextStatus, {
        branchId: workspace.branchId ?? null,
        branchName: workspace.branchName,
        franchiseId: scope?.franchiseId ?? null,
        senderId: workspace.userId,
        senderName: workspace.branchName ?? workspace.profile?.name ?? 'AVISHU Boutique',
        senderRole: 'franchisee',
      });
    } catch {
      setOptimisticStatuses((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
      setErrorMessage(copy.home.syncPaused);
    } finally {
      setMutatingOrderId(null);
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="dashboard" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1120}
      scroll
    >
      <AppHeader eyebrow={copy.home.eyebrow} subtitle={copy.home.subtitle} title={workspace.branchName ?? 'AVISHU Boutique'} />

      {isDashboardLoading ? (
        <FranchiseeDashboardSkeleton />
      ) : (
        <>
          <View style={[styles.hero, isWide ? styles.heroWide : null]}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{copy.home.heroEyebrow}</Text>
              <Text style={styles.heroTitle}>{copy.home.heroTitle}</Text>
              <Text style={styles.heroBody}>{copy.home.heroBody}</Text>

              <View style={styles.heroSupportStrip}>
                <View style={styles.heroSupportCell}>
                  <Text style={styles.heroSupportLabel}>{copy.home.liveOrders}</Text>
                  <Text style={styles.heroSupportValue}>{metrics.liveCount.toString().padStart(2, '0')}</Text>
                </View>
                <Divider style={styles.heroSupportDivider} />
                <View style={styles.heroSupportCell}>
                  <Text style={styles.heroSupportLabel}>{copy.home.unreadChat}</Text>
                  <Text style={styles.heroSupportValue}>{unreadSupportCount.toString().padStart(2, '0')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <FranchiseeMetricTile
                helper={copy.home.todayRevenueHint}
                label={copy.home.todayRevenue}
                tone="dark"
                value={formatCurrency(metrics.todayRevenue)}
              />
              <FranchiseeMetricTile
                helper={`${copy.home.planHint} ${formatCurrency(franchiseePlanTarget)}`}
                label={copy.home.planProgress}
                tone="dark"
                value={`${metrics.planProgress}%`}
              />
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorLabel}>{copy.home.syncNote}</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.metricGrid}>
            <View style={[styles.metricItem, isCompact ? styles.metricItemCompact : null]}>
              <FranchiseeMetricTile label={copy.home.newOrders} value={metrics.newOrdersCount.toString().padStart(2, '0')} />
            </View>
            <View style={[styles.metricItem, isCompact ? styles.metricItemCompact : null]}>
              <FranchiseeMetricTile label={copy.home.inProduction} value={metrics.inProductionCount.toString().padStart(2, '0')} />
            </View>
            <View style={[styles.metricItem, isCompact ? styles.metricItemCompact : null]}>
              <FranchiseeMetricTile label={copy.home.readyNow} value={metrics.readyCount.toString().padStart(2, '0')} />
            </View>
            <View style={[styles.metricItem, isCompact ? styles.metricItemCompact : null]}>
              <FranchiseeMetricTile label={copy.home.delivered} value={metrics.deliveredCount.toString().padStart(2, '0')} />
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>{copy.home.liveFlow}</Text>
          </View>

          <FranchiseeFlowStrip counts={flowCounts} />

          <FranchiseeBranchMap />

          <FranchiseeLaneSection
            count={incomingOrders.length}
            description={copy.home.incomingDescription}
            emptyDescription={copy.home.incomingEmptyDescription}
            emptyTitle={copy.home.incomingEmptyTitle}
            label={copy.home.incomingTitle}
            priority
          >
            <View style={styles.orderList}>
              {incomingOrders.map((order) => {
                const action = getFranchiseeOrderAction(order.status);

                return (
                  <FranchiseeOrderCard
                    actionLabel={action ? getActionLabel(order.status) ?? action.label : undefined}
                    isBusy={mutatingOrderId === order.id}
                    key={order.id}
                    onActionPress={() => {
                      void handleStatusUpdate(order.id);
                    }}
                    onOpenChatPress={() => router.push(`/franchisee/chat/${order.id}`)}
                    order={order}
                    productImageUrl={productById.get(order.productId)?.imageUrl}
                    thread={threadByOrderId.get(order.id)}
                  />
                );
              })}
            </View>
          </FranchiseeLaneSection>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  errorLabel: {
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
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  heroBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  heroCopy: {
    gap: theme.spacing.md,
  },
  heroEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetrics: {
    gap: theme.spacing.md,
    minWidth: 300,
  },
  heroSupportCell: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroSupportDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: theme.borders.width.thin,
  },
  heroSupportLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroSupportStrip: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroSupportValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    maxWidth: 420,
  },
  heroWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48.7%',
  },
  metricItemCompact: {
    width: '100%',
  },
  orderList: {
    gap: theme.spacing.md,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
