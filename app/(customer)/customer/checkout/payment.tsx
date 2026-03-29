import { useMemo, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckoutHeader } from '@/components/customer/CheckoutHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useProducts } from '@/hooks/useProducts';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency, formatDeliveryMethod } from '@/lib/utils/format';
import { buildOrderProductName } from '@/lib/utils/productCatalog';
import { createOrders, getDefaultFranchiseId } from '@/services/orders';
import { useCartStore } from '@/store/cart';
import { useSessionStore } from '@/store/session';

const kaspiLogo = require('../../../../kaspi.png');

type CheckoutEntry = {
  colorLabel?: string | null;
  preferredReadyDate?: string | null;
  price: number;
  productCollection?: string | null;
  productId: string;
  productName: string;
  size?: string | null;
  type: 'preorder' | 'purchase';
};

export default function CheckoutPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; productId?: string }>();
  const { products } = useProducts();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const { cartItems, draft, setReceipt } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutEntries = useMemo<CheckoutEntry[]>(() => {
    if (draft.mode === 'cart') {
      return cartItems
        .filter((item) => draft.selectedCartItemIds.includes(item.id))
        .map((item) => ({
          colorLabel: item.colorLabel,
          preferredReadyDate: item.preferredReadyDate ?? draft.preferredReadyDate,
          price: item.price,
          productCollection: item.productCollection ?? null,
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          type: item.availability === 'preorder' ? 'preorder' : 'purchase',
        }));
    }

    const product = products.find((item) => item.id === (draft.productId ?? params.productId));

    if (!product || !draft.size) {
      return [];
    }

    return [
      {
        colorLabel: draft.colorLabel,
        preferredReadyDate: draft.preferredReadyDate,
        price: product.price,
        productCollection: product.collection ?? null,
        productId: product.id,
        productName: product.name,
        size: draft.size,
        type: product.availability === 'preorder' ? 'preorder' : 'purchase',
      },
    ];
  }, [cartItems, draft, params.productId, products]);

  const total = checkoutEntries.reduce((sum, item) => sum + item.price, 0);
  const deliveryAddress = draft.deliveryMethod === 'boutique_pickup'
    ? 'AVISHU boutique pickup point'
    : draft.deliveryAddress.trim() || 'Delivery address will be confirmed in the support thread.';
  const canSubmit = checkoutEntries.length > 0 && !!currentUserId;

  const handleKaspiPayment = async () => {
    if (!canSubmit || !currentUserId) {
      return;
    }

    setIsSubmitting(true);
    const orderInputs = checkoutEntries
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId);

        if (!product) {
          return null;
        }

        return {
          customerId: currentUserId,
          customerName: currentUserName ?? 'AVISHU Client',
          customerPhoneNumber: currentUserPhoneNumber ?? null,
          delivery: {
            address: deliveryAddress,
            mapPreviewLabel:
              draft.deliveryMethod === 'boutique_pickup'
                ? 'Pickup location is confirmed in the order-linked support thread.'
                : `Pinned: ${deliveryAddress}`,
            method: draft.deliveryMethod,
            note: draft.deliveryNote.trim() || null,
          },
          franchiseId: getDefaultFranchiseId(),
          paymentMethod: 'kaspi' as const,
          preferredReadyDate: entry.preferredReadyDate ?? null,
          productCollection: entry.productCollection ?? null,
          productId: entry.productId,
          productImageUrl: product.imageUrl ?? null,
          productName: buildOrderProductName(product, {
            colorLabel: entry.colorLabel,
            size: entry.size,
          }),
          productPrice: entry.price,
          selectedColorId:
            draft.mode === 'direct'
              ? draft.colorId ?? null
              : cartItems.find((item) => item.productId === entry.productId && item.size === entry.size)?.colorId ?? null,
          selectedColorLabel: entry.colorLabel ?? null,
          selectedSize: entry.size ?? null,
          type: entry.type,
        };
      })
      .filter((value): value is NonNullable<typeof value> => !!value);

    setReceipt({
      deliveryMethod: draft.deliveryMethod,
      itemCount: checkoutEntries.length,
      items: checkoutEntries.map((item) => ({
        colorLabel: item.colorLabel,
        productName: item.productName,
        size: item.size,
      })),
      orderIds: orderInputs.map((_, index) => `pending-${Date.now()}-${index + 1}`),
      paymentMethod: 'kaspi',
      total,
    });

    router.replace('/customer/checkout/success');

    // Demo payment flow: advance instantly, then let Firebase writes settle in the background.
    void createOrders(orderInputs).catch(() => undefined);
  };

  return (
    <Screen maxContentWidth={720} scroll>
      <CheckoutHeader
        currentStep={4}
        onBackPress={() => router.back()}
        subtitle="Confirm the order summary and complete the MVP payment simulation."
        title="Payment"
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Order summary</Text>
        {checkoutEntries.map((entry) => (
          <View key={`${entry.productId}-${entry.size}-${entry.colorLabel}`} style={styles.lineItem}>
            <View style={styles.lineCopy}>
              <Text style={styles.lineTitle}>{entry.productName}</Text>
              <Text style={styles.lineMeta}>
                {[entry.colorLabel, entry.size, entry.type === 'preorder' ? 'Preorder' : 'Ready now']
                  .filter(Boolean)
                  .join(' / ')}
              </Text>
            </View>
            <Text style={styles.linePrice}>{formatCurrency(entry.price)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>{formatDeliveryMethod(draft.deliveryMethod)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Address</Text>
          <Text style={styles.summaryValue}>{deliveryAddress}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.paymentPanel}>
        <Text style={styles.paymentEyebrow}>Payment method</Text>
        <Text style={styles.paymentTitle}>Kaspi Pay</Text>
        <Text style={styles.paymentBody}>
          The payment step is simulated for MVP. Use the Kaspi action below to confirm the order.
        </Text>

        <Pressable
          disabled={!canSubmit || isSubmitting}
          onPress={() => void handleKaspiPayment()}
          style={({ pressed }) => [
            styles.kaspiButton,
            pressed ? styles.kaspiButtonPressed : null,
            !canSubmit || isSubmitting ? styles.kaspiButtonDisabled : null,
          ]}
        >
          <Image resizeMode="contain" source={kaspiLogo} style={styles.kaspiLogo} />
          <Text style={styles.kaspiButtonLabel}>{isSubmitting ? 'Processing payment' : 'Pay with Kaspi'}</Text>
        </Pressable>

        <Button
          label="Back to delivery"
          onPress={() => router.back()}
          size="sm"
          style={styles.secondaryAction}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: theme.colors.border.subtle,
    height: theme.borders.width.thin,
  },
  kaspiButton: {
    alignItems: 'center',
    backgroundColor: '#E5291C',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  kaspiButtonDisabled: {
    opacity: 0.45,
  },
  kaspiButtonLabel: {
    color: '#FFFFFF',
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  kaspiButtonPressed: {
    opacity: 0.88,
  },
  kaspiLogo: {
    height: 22,
    width: 22,
  },
  lineCopy: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.md,
  },
  lineItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  linePrice: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  lineTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  paymentBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 420,
  },
  paymentEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  paymentPanel: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  paymentTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  secondaryAction: {
    width: '100%',
  },
  summaryCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  summaryEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryRow: {
    alignItems: 'flex-start',
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
    lineHeight: theme.typography.lineHeight.sm,
    marginLeft: theme.spacing.lg,
    maxWidth: 260,
    textAlign: 'right',
  },
});
