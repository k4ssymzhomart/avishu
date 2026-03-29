import { useMemo } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckoutHeader } from '@/components/customer/CheckoutHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useFranchises } from '@/hooks/useFranchises';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useProducts } from '@/hooks/useProducts';
import { useProductionUnits } from '@/hooks/useProductionUnits';
import { demoUsersByRole } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { buildOrderProductName } from '@/lib/utils/productCatalog';
import { createOrders } from '@/services/orders';
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
  const { copy, formatDeliveryMethodLabel, language } = useCustomerI18n();
  const { products } = useProducts();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const currentUserProfile = useSessionStore((state) => state.currentUserProfile);
  const { cartItems, draft, setReceipt } = useCartStore();
  const { franchises } = useFranchises();
  const { productionUnits } = useProductionUnits();

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
  const assignedFranchiseId =
    currentUserProfile?.assignedFranchiseId ?? demoUsersByRole.customer.franchiseId ?? demoUsersByRole.franchisee.id;
  const assignedFranchiseName =
    currentUserProfile?.assignedFranchiseName ??
    demoUsersByRole.customer.franchiseName ??
    demoUsersByRole.franchisee.branchName ??
    'AVISHU Boutique';
  const assignedFranchise = franchises.find((franchise) => franchise.id === assignedFranchiseId) ?? null;
  const assignedProductionUnit =
    productionUnits.find((unit) => unit.linkedFranchises.includes(assignedFranchiseId)) ?? null;
  const deliveryAddress =
    draft.deliveryMethod === 'boutique_pickup'
      ? assignedFranchise?.address ?? copy.checkout.pickupLocation
      : draft.deliveryAddress.trim() || copy.chatThread.addressFallback;
  const canSubmit = checkoutEntries.length > 0 && !!currentUserId;

  const handleKaspiPayment = () => {
    if (!canSubmit || !currentUserId) {
      return;
    }

    const orderInputs = checkoutEntries
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId);

        if (!product) {
          return null;
        }

        return {
          customerId: currentUserId,
          customerName: currentUserName ?? (language === 'ru' ? 'Клиент AVISHU' : 'AVISHU Client'),
          customerPhoneNumber: currentUserPhoneNumber ?? null,
          delivery: {
            address: deliveryAddress,
            mapPreviewLabel:
              draft.deliveryMethod === 'boutique_pickup'
                ? assignedFranchise?.name ?? copy.checkout.pickupHint
                : language === 'ru'
                  ? `Закреплено: ${deliveryAddress}`
                  : `Pinned: ${deliveryAddress}`,
            method: draft.deliveryMethod,
            note: draft.deliveryNote.trim() || null,
          },
          branchId: assignedFranchiseId,
          branchName: assignedFranchiseName,
          franchiseId: assignedFranchiseId,
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
          productionUnitId: assignedProductionUnit?.id ?? demoUsersByRole.production.productionUnitId ?? null,
          productionUnitName: assignedProductionUnit?.name ?? demoUsersByRole.production.productionUnitName ?? null,
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

    // Keep payment as an instant next-step button while the shared order write runs in the background.
    void createOrders(orderInputs).catch(() => undefined);
  };

  return (
    <Screen maxContentWidth={720} scroll>
      <CheckoutHeader
        currentStep={4}
        eyebrow={copy.checkout.purchaseFlow}
        onBackPress={() => router.back()}
        stepLabel={copy.checkout.step}
        subtitle={copy.checkout.paymentSubtitle}
        title={copy.checkout.payment}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>{copy.checkout.orderSummary}</Text>
        {checkoutEntries.map((entry, index) => (
          <View key={`${entry.productId}-${entry.size}-${entry.colorLabel}-${index}`} style={styles.lineItem}>
            <View style={styles.lineCopy}>
              <Text style={styles.lineTitle}>{entry.productName}</Text>
              <Text style={styles.lineMeta}>
                {[entry.colorLabel, entry.size, entry.type === 'preorder' ? copy.checkout.preorderPiece : copy.checkout.availableNow]
                  .filter(Boolean)
                  .join(' / ')}
              </Text>
            </View>
            <Text style={styles.linePrice}>{formatCurrency(entry.price)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{copy.checkout.delivery}</Text>
          <Text style={styles.summaryValue}>{formatDeliveryMethodLabel(draft.deliveryMethod)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{copy.checkout.address}</Text>
          <Text style={styles.summaryValue}>{deliveryAddress}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{copy.checkout.total}</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.paymentPanel}>
        <Text style={styles.paymentEyebrow}>{copy.checkout.paymentMethod}</Text>
        <Text style={styles.paymentTitle}>{copy.checkout.paymentTitle}</Text>
        <Text style={styles.paymentBody}>{copy.checkout.paymentBody}</Text>

        <Pressable
          disabled={!canSubmit}
          onPress={handleKaspiPayment}
          style={({ pressed }) => [
            styles.kaspiButton,
            pressed ? styles.kaspiButtonPressed : null,
            !canSubmit ? styles.kaspiButtonDisabled : null,
          ]}
        >
          <Image resizeMode="contain" source={kaspiLogo} style={styles.kaspiLogo} />
          <Text style={styles.kaspiButtonLabel}>{copy.checkout.payWithKaspi}</Text>
        </Pressable>

        <Button
          label={copy.checkout.backToDelivery}
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
