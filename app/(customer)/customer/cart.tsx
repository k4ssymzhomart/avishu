import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency, formatDateLabel } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart';

export default function CustomerCartScreen() {
  const router = useRouter();
  const { copy, language } = useCustomerI18n();
  const { beginCartCheckout, cartItems, hasHydratedCart, removeItem } = useCartStore();

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  return (
    <Screen maxContentWidth={820} scroll>
      <AppHeader
        eyebrow={language === 'ru' ? 'AVISHU / КОРЗИНА' : 'AVISHU / CART'}
        onBackPress={() => router.back()}
        showBackButton
        subtitle={copy.cart.subtitle}
        title={copy.cart.title}
      />

      {!hasHydratedCart ? (
        <LoadingState label={copy.cart.loading} />
      ) : cartItems.length ? (
        <>
          <View style={styles.list}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemMain}>
                  <View style={styles.imageWrap}>
                    {item.imageUrl ? (
                      <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : null}
                  </View>

                  <View style={styles.itemCopy}>
                    <Text style={styles.itemEyebrow}>{item.productCollection ?? 'AVISHU'}</Text>
                    <Text style={styles.itemTitle}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>
                      {[item.colorLabel, item.size, item.preferredReadyDate ? formatDateLabel(item.preferredReadyDate, { language }) : null]
                        .filter(Boolean)
                        .join(' / ')}
                    </Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                </View>

                <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton}>
                  <Text style={styles.removeLabel}>{copy.cart.remove}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.cart.pieces}</Text>
              <Text style={styles.summaryValue}>{cartItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{copy.cart.total}</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              label={copy.cart.checkout}
              onPress={() => {
                beginCartCheckout();
                router.push('/customer/checkout/delivery?mode=cart');
              }}
              style={styles.actionButton}
            />
            <Button
              label={copy.cart.continueShopping}
              onPress={() => router.replace('/customer')}
              style={styles.actionButton}
              variant="secondary"
            />
          </View>
        </>
      ) : (
        <EmptyState
          description={copy.cart.emptyDescription}
          title={copy.cart.emptyTitle}
        />
      )}
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
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrap: {
    backgroundColor: theme.colors.surface.muted,
    height: 124,
    overflow: 'hidden',
    width: 96,
  },
  itemCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  itemMain: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  itemMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  itemPrice: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    marginTop: theme.spacing.xs,
  },
  itemTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  list: {
    gap: theme.spacing.md,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  removeLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryCard: {
    backgroundColor: theme.colors.surface.muted,
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
});
