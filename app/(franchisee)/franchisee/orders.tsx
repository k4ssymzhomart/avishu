import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FranchiseeChipRail } from '@/components/franchisee/FranchiseeChipRail';
import { FranchiseeFlowStrip } from '@/components/franchisee/FranchiseeFlowStrip';
import { FranchiseeOrdersLedger } from '@/components/franchisee/FranchiseeOrdersLedger';
import { FranchiseeOrdersSkeleton } from '@/components/franchisee/FranchiseeSkeletons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
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
  franchiseeFlowStages,
  getFranchiseeFlowCounts,
  getFranchiseeUnreadSupportCount,
} from '@/lib/utils/franchisee';
import { updateOrderStatus } from '@/services/orders';
import type { OrderStatus } from '@/types/order';

type StatusFilterKey = 'all' | OrderStatus;

export default function FranchiseeOrdersScreen() {
  const router = useRouter();
  const workspace = useFranchiseeWorkspace();
  const { copy, getStatusLabel } = useFranchiseeI18n();
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
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');

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
  const visibleOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return displayOrders.filter((order) => order.status !== 'cancelled');
    }

    return displayOrders.filter((order) => order.status === statusFilter);
  }, [displayOrders, statusFilter]);

  const statusItems = useMemo(
    () => [
      {
        count: displayOrders.filter((order) => order.status !== 'cancelled').length,
        key: 'all',
        label: copy.orders.all,
      },
      ...franchiseeFlowStages.map((stage) => ({
        count: flowCounts[stage.status],
        key: stage.status,
        label: getStatusLabel(stage.status),
      })),
    ],
    [copy.orders.all, displayOrders, flowCounts, getStatusLabel],
  );

  const handleStatusUpdate = async (orderId: string) => {
    const order = displayOrders.find((entry) => entry.id === orderId);

    if (!order) {
      return;
    }

    const nextStatus =
      order.status === 'placed'
        ? 'accepted'
        : order.status === 'accepted'
          ? 'in_production'
          : order.status === 'ready'
            ? 'out_for_delivery'
            : order.status === 'out_for_delivery'
              ? 'delivered'
              : null;

    if (!nextStatus) {
      return;
    }

    setMutatingOrderId(orderId);
    setErrorMessage(null);
    setOptimisticStatuses((current) => ({
      ...current,
      [orderId]: nextStatus,
    }));

    try {
      await updateOrderStatus(orderId, nextStatus, {
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
      setErrorMessage(copy.orders.syncError);
    } finally {
      setMutatingOrderId(null);
    }
  };

  return (
    <Screen
      footer={<RoleBottomNav activeKey="orders" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1160}
      scroll
    >
      <AppHeader eyebrow={copy.orders.eyebrow} subtitle={copy.orders.subtitle} title={copy.orders.title} />

      <View style={styles.summaryStrip}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.orders.liveIntake}</Text>
          <Text style={styles.summaryValue}>{metrics.newOrdersCount}</Text>
          <Text style={styles.summaryBody}>{copy.orders.liveIntakeHint}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.orders.readyHandoff}</Text>
          <Text style={styles.summaryValue}>{metrics.readyCount}</Text>
          <Text style={styles.summaryBody}>{copy.orders.readyHandoffHint}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.orders.support}</Text>
          <Text style={styles.summaryValue}>{unreadSupportCount}</Text>
          <Text style={styles.summaryBody}>{copy.orders.supportHint}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.orders.pipelineValue}</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(
              displayOrders
                .filter((order) => !['delivered', 'cancelled'].includes(order.status))
                .reduce((sum, order) => sum + order.productPrice, 0),
            )}
          </Text>
          <Text style={styles.summaryBody}>{copy.orders.pipelineHint}</Text>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorLabel}>{copy.orders.syncNote}</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <FranchiseeFlowStrip counts={flowCounts} />

      <View style={styles.filterBlock}>
        <View style={styles.filterCopy}>
          <Text style={styles.filterLabel}>{copy.orders.statusColumn}</Text>
          <Text style={styles.filterBody}>{copy.orders.filterHint}</Text>
        </View>
        <FranchiseeChipRail
          items={statusItems}
          onSelect={(nextKey) => setStatusFilter(nextKey as StatusFilterKey)}
          selectedKey={statusFilter}
        />
      </View>

      {isLoading && !orders.length ? (
        <FranchiseeOrdersSkeleton count={6} />
      ) : (
        <FranchiseeOrdersLedger
          isBusyOrderId={mutatingOrderId}
          onOpenChat={(orderId) => router.push(`/franchisee/chat/${orderId}`)}
          onStatusAction={handleStatusUpdate}
          orders={visibleOrders}
          productById={productById}
          threadByOrderId={threadByOrderId}
        />
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
  filterBlock: {
    gap: theme.spacing.md,
  },
  filterBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  filterCopy: {
    gap: theme.spacing.xs,
  },
  filterLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  summaryCell: {
    flex: 1,
    gap: theme.spacing.sm,
    minWidth: 220,
    padding: theme.spacing.lg,
  },
  summaryLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryStrip: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  summaryValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
