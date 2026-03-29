import { StyleSheet, Text, View } from 'react-native';

import { CustomerOrderTracker } from '@/components/order/CustomerOrderTracker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';
import { formatDeliveryMethod, formatRelativeTime } from '@/lib/utils/format';
import type { Order } from '@/types/order';

type ActiveOrderSummaryProps = {
  onOpenChat: () => void;
  onOpenOrders: () => void;
  order: Order;
};

export function ActiveOrderSummary({ onOpenChat, onOpenOrders, order }: ActiveOrderSummaryProps) {
  return (
    <Card padding="lg">
      <Text style={styles.eyebrow}>Active order</Text>
      <Text style={styles.title}>{order.productName}</Text>
      <Text style={styles.body}>
        {`Updated ${formatRelativeTime(order.updatedAt)}. Delivery via ${formatDeliveryMethod(order.delivery.method)}.`}
      </Text>
      <CustomerOrderTracker status={order.status} />
      <View style={styles.actions}>
        <Button label="View order" onPress={onOpenOrders} size="sm" />
        <Button label="Open chat" onPress={onOpenChat} size="sm" variant="secondary" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
