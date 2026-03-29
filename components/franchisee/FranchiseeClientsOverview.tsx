import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Divider } from '@/components/ui/Divider';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { theme } from '@/lib/theme/tokens';
import type { OrderChatThread } from '@/types/chat';
import type { Order } from '@/types/order';

export type FranchiseeClientOverviewItem = {
  activeOrder?: Order | null;
  customerId: string;
  latestOrder: Order;
  name: string;
  phoneNumber?: string | null;
  selectedOrderId: string;
  thread?: OrderChatThread | null;
};

type FranchiseeClientsOverviewProps = {
  clients: FranchiseeClientOverviewItem[];
  onSelect: (customerId: string) => void;
  selectedCustomerId: string | null;
};

export function FranchiseeClientsOverview({
  clients,
  onSelect,
  selectedCustomerId,
}: FranchiseeClientsOverviewProps) {
  const { width } = useWindowDimensions();
  const { copy, formatRelativeLabel, getStatusLabel } = useFranchiseeI18n();
  const isWide = width >= 920;

  if (!clients.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{copy.common.noResults}</Text>
        <Text style={styles.emptyBody}>{copy.clients.overviewHint}</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      {isWide ? (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, styles.nameCell]}>{copy.clients.title}</Text>
            <Text style={[styles.headerLabel, styles.orderCell]}>{copy.orders.productColumn}</Text>
            <Text style={[styles.headerLabel, styles.statusCell]}>{copy.orders.statusColumn}</Text>
            <Text style={[styles.headerLabel, styles.supportCell]}>{copy.orders.supportColumn}</Text>
          </View>
          <Divider />
        </>
      ) : null}

      {clients.map((client, index) => {
        const order = client.activeOrder ?? client.latestOrder;
        const unreadCount = client.thread?.unreadCountForSupport ?? 0;
        const isSelected = client.customerId === selectedCustomerId;

        return (
          <View key={client.customerId}>
            {index ? <Divider /> : null}
            <Pressable
              onPress={() => onSelect(client.customerId)}
              style={({ pressed }) => [
                styles.row,
                isWide ? styles.rowWide : null,
                isSelected ? styles.rowSelected : null,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={[styles.nameCell, styles.nameBlock]}>
                <Text style={styles.name}>{client.name}</Text>
                <Text style={styles.phone}>{client.phoneNumber ?? copy.clients.phonePending}</Text>
              </View>
              <View style={[styles.orderCell, styles.metaBlock]}>
                <Text style={styles.metaPrimary}>{order.productName}</Text>
                <Text style={styles.metaSecondary}>{formatRelativeLabel(order.updatedAt)}</Text>
              </View>
              <View style={[styles.statusCell, styles.metaBlock]}>
                <Text style={styles.metaPrimary}>{getStatusLabel(order.status)}</Text>
                <Text style={styles.metaSecondary}>{order.id}</Text>
              </View>
              <View style={[styles.supportCell, styles.metaBlock]}>
                <Text numberOfLines={1} style={styles.metaPrimary}>
                  {client.thread?.lastMessageText ?? copy.common.synced}
                </Text>
                <Text style={styles.metaSecondary}>
                  {unreadCount ? `${unreadCount} ${copy.common.unreadSuffix}` : copy.common.synced}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
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
  headerLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  metaBlock: {
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  metaPrimary: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  metaSecondary: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  name: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  nameBlock: {
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  nameCell: {
    flex: 1.6,
  },
  orderCell: {
    flex: 1.5,
  },
  phone: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  row: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  rowPressed: {
    opacity: 0.82,
  },
  rowSelected: {
    backgroundColor: theme.colors.surface.muted,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  rowWide: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusCell: {
    flex: 1.05,
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
});
