import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency, formatDeliveryMethod } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { clearReceipt, lastReceipt } = useCartStore();

  if (!lastReceipt) {
    return (
      <Screen maxContentWidth={640} scroll>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No confirmed order</Text>
          <Text style={styles.emptyBody}>Complete payment to see the final confirmation screen.</Text>
          <Button label="Return home" onPress={() => router.replace('/customer')} size="sm" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen maxContentWidth={640} scroll>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <AssetIcon color={theme.colors.text.primary} name="orderPlaced" size={28} />
        </View>
        <Text style={styles.eyebrow}>AVISHU / ORDER CONFIRMED</Text>
        <Text style={styles.title}>Order confirmed</Text>
        <Text style={styles.subtitle}>
          Your payment is confirmed and the boutique support thread is now the next step for updates.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pieces</Text>
          <Text style={styles.summaryValue}>{lastReceipt.itemCount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment</Text>
          <Text style={styles.summaryValue}>Kaspi Pay</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>{formatDeliveryMethod(lastReceipt.deliveryMethod)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(lastReceipt.total)}</Text>
        </View>
      </View>

      <View style={styles.itemPanel}>
        <Text style={styles.panelEyebrow}>Confirmed items</Text>
        {lastReceipt.items.map((item) => (
          <View key={`${item.productName}-${item.size}-${item.colorLabel}`} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.itemMeta}>{[item.colorLabel, item.size].filter(Boolean).join(' / ') || 'Selected piece'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label="Open orders"
          onPress={() => {
            clearReceipt();
            router.replace('/customer/orders');
          }}
          style={styles.actionButton}
        />
        <Button
          label="Continue shopping"
          onPress={() => {
            clearReceipt();
            router.replace('/customer');
          }}
          style={styles.actionButton}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: '100%',
  },
  actions: {
    gap: theme.spacing.sm,
  },
  emptyBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    justifyContent: 'center',
    minHeight: 420,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  hero: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  itemMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  itemName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  itemPanel: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  itemRow: {
    gap: 2,
  },
  panelEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 440,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTotal: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  summaryValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 32,
    lineHeight: 38,
  },
});
