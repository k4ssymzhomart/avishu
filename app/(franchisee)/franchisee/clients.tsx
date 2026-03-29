import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { FranchiseeChipRail } from '@/components/franchisee/FranchiseeChipRail';
import { FranchiseeClientCard } from '@/components/franchisee/FranchiseeClientCard';
import {
  FranchiseeClientsOverview,
  type FranchiseeClientOverviewItem,
} from '@/components/franchisee/FranchiseeClientsOverview';
import { FranchiseeClientsSkeleton } from '@/components/franchisee/FranchiseeSkeletons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeChatThreads } from '@/hooks/useChat';
import { useFranchiseeBottomNav } from '@/hooks/useFranchiseeBottomNav';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { useFranchiseeWorkspace } from '@/hooks/useFranchiseeWorkspace';
import { useFranchiseeOrders } from '@/hooks/useOrders';
import { theme } from '@/lib/theme/tokens';
import { getFranchiseeUnreadSupportCount, getKnownClientPhone } from '@/lib/utils/franchisee';

type ClientFilterKey = 'active' | 'all' | 'unread';
type ClientSortKey = 'name' | 'recent' | 'unread';

export default function FranchiseeClientsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const workspace = useFranchiseeWorkspace();
  const { copy } = useFranchiseeI18n();
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
  const { threads } = useFranchiseeChatThreads(scope);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<ClientFilterKey>('all');
  const [clientSort, setClientSort] = useState<ClientSortKey>('recent');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isWide = width >= 980;

  const clients = useMemo<FranchiseeClientOverviewItem[]>(() => {
    const grouped = new Map<string, typeof orders>();

    orders.forEach((order) => {
      const current = grouped.get(order.customerId) ?? [];
      grouped.set(order.customerId, [...current, order]);
    });

    return [...grouped.entries()].map(([customerId, customerOrders]) => {
      const sortedOrders = [...customerOrders].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
      const latestOrder = sortedOrders[0];
      const activeOrder = sortedOrders.find((order) => !['delivered', 'cancelled'].includes(order.status)) ?? null;
      const selectedOrder = activeOrder ?? latestOrder;
      const thread =
        threads.find((entry) => entry.orderId === selectedOrder.id) ??
        threads.find((entry) => entry.customerId === customerId) ??
        null;

      return {
        activeOrder,
        customerId,
        latestOrder,
        name: latestOrder.customerName,
        phoneNumber:
          activeOrder?.customerPhoneNumber ??
          latestOrder.customerPhoneNumber ??
          thread?.customerPhoneNumber ??
          getKnownClientPhone(customerId),
        selectedOrderId: selectedOrder.id,
        thread,
      };
    });
  }, [orders, threads]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return [...clients]
      .filter((client) => {
        if (clientFilter === 'active' && !client.activeOrder) {
          return false;
        }

        if (clientFilter === 'unread' && !(client.thread?.unreadCountForSupport ?? 0)) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [client.name, client.phoneNumber ?? '', client.latestOrder.productName]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (clientSort === 'name') {
          return left.name.localeCompare(right.name, 'ru');
        }

        if (clientSort === 'unread') {
          return (right.thread?.unreadCountForSupport ?? 0) - (left.thread?.unreadCountForSupport ?? 0);
        }

        return Date.parse(right.latestOrder.updatedAt) - Date.parse(left.latestOrder.updatedAt);
      });
  }, [clientFilter, clientSort, clients, deferredSearchQuery]);

  useEffect(() => {
    if (!filteredClients.length) {
      setSelectedCustomerId(null);
      return;
    }

    if (!selectedCustomerId || !filteredClients.some((client) => client.customerId === selectedCustomerId)) {
      setSelectedCustomerId(filteredClients[0].customerId);
    }
  }, [filteredClients, selectedCustomerId]);

  const selectedClient = filteredClients.find((client) => client.customerId === selectedCustomerId) ?? null;
  const unreadSupportCount = getFranchiseeUnreadSupportCount(threads);
  const activeClientsCount = clients.filter((client) => client.activeOrder).length;
  const filterItems = [
    { count: clients.length, key: 'all', label: copy.clients.all },
    { count: activeClientsCount, key: 'active', label: copy.clients.activeView },
    { count: unreadSupportCount, key: 'unread', label: copy.clients.unread },
  ];
  const sortItems = [
    { key: 'recent', label: copy.clients.recentSort },
    { key: 'name', label: copy.clients.nameSort },
    { key: 'unread', label: copy.clients.unreadSort },
  ];

  return (
    <Screen
      footer={<RoleBottomNav activeKey="clients" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1160}
      scroll
    >
      <AppHeader eyebrow={copy.clients.eyebrow} subtitle={copy.clients.subtitle} title={copy.clients.title} />

      <View style={styles.summaryCard}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.clients.recentClients}</Text>
          <Text style={styles.summaryValue}>{clients.length.toString().padStart(2, '0')}</Text>
        </View>
        <Divider style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.clients.activeRelationships}</Text>
          <Text style={styles.summaryValue}>{activeClientsCount.toString().padStart(2, '0')}</Text>
        </View>
        <Divider style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>{copy.clients.unreadSupport}</Text>
          <Text style={styles.summaryValue}>{unreadSupportCount.toString().padStart(2, '0')}</Text>
        </View>
      </View>

      <View style={styles.controlsBlock}>
        <View style={styles.searchShell}>
          <Text style={styles.searchLabel}>{copy.common.search}</Text>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder={copy.clients.searchPlaceholder}
            placeholderTextColor={theme.colors.text.tertiary}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{copy.clients.overviewTitle}</Text>
          <FranchiseeChipRail
            items={filterItems}
            onSelect={(nextKey) => setClientFilter(nextKey as ClientFilterKey)}
            selectedKey={clientFilter}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{copy.clients.sortBy}</Text>
          <FranchiseeChipRail
            items={sortItems}
            onSelect={(nextKey) => setClientSort(nextKey as ClientSortKey)}
            selectedKey={clientSort}
          />
        </View>
      </View>

      {isLoading && !orders.length ? (
        <FranchiseeClientsSkeleton count={3} />
      ) : filteredClients.length ? (
        <View style={[styles.contentGrid, isWide ? styles.contentGridWide : null]}>
          <View style={styles.overviewColumn}>
            <Text style={styles.sectionBody}>{copy.clients.overviewHint}</Text>
            <FranchiseeClientsOverview
              clients={filteredClients}
              onSelect={setSelectedCustomerId}
              selectedCustomerId={selectedCustomerId}
            />
          </View>

          <View style={styles.detailColumn}>
            <Text style={styles.sectionBody}>{copy.clients.detailHint}</Text>
            {selectedClient ? (
              <FranchiseeClientCard
                activeOrder={selectedClient.activeOrder}
                latestOrder={selectedClient.latestOrder}
                name={selectedClient.name}
                onOpenChatPress={() => router.push(`/franchisee/chat/${selectedClient.thread?.orderId ?? selectedClient.selectedOrderId}`)}
                onOpenOrderPress={() => router.push('/franchisee/orders')}
                phoneNumber={selectedClient.phoneNumber}
                thread={selectedClient.thread}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <EmptyState
          description={deferredSearchQuery.trim().length ? copy.common.noResults : copy.clients.emptyDescription}
          title={deferredSearchQuery.trim().length ? copy.common.noResults : copy.clients.emptyTitle}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentGrid: {
    gap: theme.spacing.lg,
  },
  contentGridWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  controlsBlock: {
    gap: theme.spacing.lg,
  },
  detailColumn: {
    flex: 1.05,
    gap: theme.spacing.md,
  },
  filterGroup: {
    gap: theme.spacing.sm,
  },
  filterLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  overviewColumn: {
    flex: 0.95,
    gap: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 18,
    borderWidth: theme.borders.width.thin,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
  },
  searchLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  searchShell: {
    gap: theme.spacing.sm,
  },
  sectionBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 520,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  summaryCell: {
    flex: 1,
    gap: theme.spacing.sm,
    minHeight: 128,
    minWidth: 220,
    padding: theme.spacing.lg,
  },
  summaryDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: theme.borders.width.thin,
  },
  summaryLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
