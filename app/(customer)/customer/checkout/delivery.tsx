import { useEffect, useMemo } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CalendarDatePicker } from '@/components/customer/CalendarDatePicker';
import { CheckoutHeader } from '@/components/customer/CheckoutHeader';
import { CheckoutProductSummary } from '@/components/customer/CheckoutProductSummary';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useFranchises } from '@/hooks/useFranchises';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useProducts } from '@/hooks/useProducts';
import { demoUsersByRole } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { buildPreorderDates, getProductCatalogMeta } from '@/lib/utils/productCatalog';
import { useCartStore } from '@/store/cart';
import { useSessionStore } from '@/store/session';
import type { DeliveryMethod } from '@/types/order';

const deliveryMethods: DeliveryMethod[] = ['boutique_pickup', 'city_courier', 'express_courier'];

export default function CheckoutDeliveryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; productId?: string }>();
  const { copy, formatDeliveryMethodLabel, language } = useCustomerI18n();
  const { products } = useProducts();
  const currentUserProfile = useSessionStore((state) => state.currentUserProfile);
  const { franchises } = useFranchises();
  const { beginCartCheckout, beginDirectCheckout, cartItems, draft, updateDraft } = useCartStore();
  const assignedFranchiseId = currentUserProfile?.assignedFranchiseId ?? demoUsersByRole.customer.franchiseId ?? null;
  const assignedFranchise = franchises.find((franchise) => franchise.id === assignedFranchiseId) ?? null;
  const pickupLocation = assignedFranchise?.address ?? copy.checkout.pickupLocation;
  const pickupHint = assignedFranchise?.name ?? copy.checkout.pickupHint;

  const directProduct = products.find((item) => item.id === params.productId);
  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => draft.selectedCartItemIds.includes(item.id)),
    [cartItems, draft.selectedCartItemIds],
  );
  const singleCartItem = selectedCartItems.length === 1 ? selectedCartItems[0] : null;
  const singleCartProduct = singleCartItem
    ? products.find((item) => item.id === singleCartItem.productId)
    : null;
  const checkoutProduct = draft.mode === 'cart' ? singleCartProduct : directProduct;
  const preorderDates =
    checkoutProduct?.availability === 'preorder' && checkoutProduct.preorderLeadDays
      ? buildPreorderDates(checkoutProduct.preorderLeadDays)
      : [];

  useEffect(() => {
    if (params.mode === 'cart' && draft.mode !== 'cart') {
      beginCartCheckout();
    }

    if (params.mode !== 'cart' && directProduct && (draft.mode !== 'direct' || draft.productId !== directProduct.id)) {
      beginDirectCheckout(directProduct);
    }
  }, [beginCartCheckout, beginDirectCheckout, directProduct, draft.mode, draft.productId, params.mode]);

  useEffect(() => {
    if (draft.mode === 'cart' && singleCartItem && singleCartItem.preferredReadyDate && !draft.preferredReadyDate) {
      updateDraft({ preferredReadyDate: singleCartItem.preferredReadyDate });
    }
  }, [draft.mode, draft.preferredReadyDate, singleCartItem, updateDraft]);

  useEffect(() => {
    const defaultAddress = currentUserProfile?.addresses.find((address) => address.isDefault) ?? currentUserProfile?.addresses[0];

    if (!defaultAddress || draft.deliveryAddress.trim().length > 0 || draft.deliveryMethod === 'boutique_pickup') {
      return;
    }

    updateDraft({
      deliveryAddress: [defaultAddress.line1, defaultAddress.line2, defaultAddress.city].filter(Boolean).join(', '),
    });
  }, [currentUserProfile?.addresses, draft.deliveryAddress, draft.deliveryMethod, updateDraft]);

  const needsAddress = draft.deliveryMethod !== 'boutique_pickup';
  const canContinue = !needsAddress || draft.deliveryAddress.trim().length >= 6;

  return (
    <Screen
      footer={
        <Button
          disabled={!canContinue}
          label={copy.checkout.continueToPayment}
          onPress={() =>
            router.push(
              draft.mode === 'cart'
                ? '/customer/checkout/payment?mode=cart'
                : `/customer/checkout/payment?productId=${directProduct?.id ?? ''}`,
            )
          }
          style={styles.footerButton}
        />
      }
      footerMaxWidth={720}
      keyboardVerticalOffset={18}
      maxContentWidth={720}
      scroll
    >
      <CheckoutHeader
        currentStep={3}
        eyebrow={copy.checkout.purchaseFlow}
        onBackPress={() => router.back()}
        stepLabel={copy.checkout.step}
        subtitle={copy.checkout.deliverySubtitle}
        title={copy.checkout.deliveryTitle}
      />

      {draft.mode === 'cart' && selectedCartItems.length > 1 ? (
        <View style={styles.multiItemPanel}>
          <Text style={styles.multiItemEyebrow}>{copy.checkout.multiItemEyebrow}</Text>
          <Text style={styles.multiItemTitle}>{`${selectedCartItems.length} ${copy.checkout.selectedCartPieces}`}</Text>
          <Text style={styles.multiItemBody}>
            {selectedCartItems.map((item) => `${item.productName} / ${item.size}`).join('\n')}
          </Text>
        </View>
      ) : checkoutProduct ? (
        <CheckoutProductSummary
          details={[
            checkoutProduct.collection ?? 'AVISHU',
            singleCartItem?.size ?? draft.size ?? getProductCatalogMeta(checkoutProduct).sizes[0],
          ]}
          eyebrow={copy.checkout.orderSummary}
          imageUrl={checkoutProduct.imageUrl}
          price={formatCurrency(checkoutProduct.price)}
          title={checkoutProduct.name}
        />
      ) : null}

      {checkoutProduct?.availability === 'preorder' && preorderDates.length > 0 && selectedCartItems.length <= 1 ? (
        <CalendarDatePicker
          availableDates={preorderDates}
          helper={copy.checkout.preorderHelper}
          label={copy.checkout.preferredReadyDate}
          locale={language === 'ru' ? 'ru-RU' : 'en-US'}
          onSelect={(value) => updateDraft({ preferredReadyDate: value })}
          selectedDate={draft.preferredReadyDate ?? preorderDates[0]}
          selectDateLabel={copy.checkout.readyTarget}
          weekdayLabels={language === 'ru' ? ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']}
        />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.checkout.method}</Text>
        <View style={styles.methodGrid}>
          {deliveryMethods.map((method) => {
            const isSelected = draft.deliveryMethod === method;

            return (
              <Pressable
                key={method}
                onPress={() => updateDraft({ deliveryMethod: method })}
                style={[styles.methodCard, isSelected ? styles.methodCardActive : null]}
              >
                <Text style={[styles.methodLabel, isSelected ? styles.methodLabelActive : null]}>
                  {formatDeliveryMethodLabel(method)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.checkout.address}</Text>
        <TextInput
          editable={needsAddress}
          onChangeText={(value) => updateDraft({ deliveryAddress: value })}
          placeholder={needsAddress ? copy.checkout.addressPlaceholder : pickupLocation}
          placeholderTextColor={theme.colors.text.tertiary}
          style={[styles.field, !needsAddress ? styles.fieldDisabled : null]}
          value={needsAddress ? draft.deliveryAddress : pickupLocation}
        />
        <Text style={styles.fieldHint}>
          {needsAddress ? copy.checkout.courierHint : pickupHint}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.checkout.note}</Text>
        <TextInput
          multiline
          onChangeText={(value) => updateDraft({ deliveryNote: value })}
          placeholder={copy.checkout.notePlaceholder}
          placeholderTextColor={theme.colors.text.tertiary}
          style={[styles.field, styles.fieldMultiline]}
          textAlignVertical="top"
          value={draft.deliveryNote}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fieldDisabled: {
    color: theme.colors.text.secondary,
  },
  fieldHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  fieldMultiline: {
    minHeight: 104,
  },
  footerButton: {
    width: '100%',
  },
  methodCard: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
  },
  methodCardActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  methodGrid: {
    gap: theme.spacing.sm,
  },
  methodLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  methodLabelActive: {
    color: theme.colors.text.inverse,
  },
  multiItemBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: 22,
  },
  multiItemEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  multiItemPanel: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  multiItemTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
