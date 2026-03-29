import { useEffect } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckoutHeader } from '@/components/customer/CheckoutHeader';
import { CheckoutProductSummary } from '@/components/customer/CheckoutProductSummary';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useProducts } from '@/hooks/useProducts';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { getProductCatalogMeta } from '@/lib/utils/productCatalog';
import { useCartStore } from '@/store/cart';

export default function CheckoutSizeScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { copy, formatAvailabilityLabel, language } = useCustomerI18n();
  const { products } = useProducts();
  const product = products.find((item) => item.id === productId);
  const { beginDirectCheckout, draft, saveItemToCart, updateDraft } = useCartStore();

  useEffect(() => {
    if (product && (draft.mode !== 'direct' || draft.productId !== product.id)) {
      beginDirectCheckout(product);
    }
  }, [beginDirectCheckout, draft.mode, draft.productId, product]);

  if (!product) {
    return (
      <Screen scroll>
        <CheckoutHeader
          currentStep={2}
          eyebrow={copy.checkout.purchaseFlow}
          onBackPress={() => router.back()}
          stepLabel={copy.checkout.step}
          title={copy.checkout.sizeTitle}
        />
        <Text style={styles.emptyText}>{copy.checkout.unavailableProduct}</Text>
      </Screen>
    );
  }

  const meta = getProductCatalogMeta(product);
  const selectedColor = meta.colors.find((option) => option.id === draft.colorId) ?? meta.colors[0];
  const selectedSize = draft.size;

  const handleAddToCart = () => {
    if (!selectedSize) {
      return;
    }

    updateDraft({
      colorId: selectedColor?.id ?? null,
      colorLabel: selectedColor?.label ?? null,
    });
    saveItemToCart(product, {
      colorId: selectedColor?.id ?? null,
      colorLabel: selectedColor?.label ?? null,
      preferredReadyDate: draft.preferredReadyDate,
      size: selectedSize,
    });
    router.replace('/customer/cart');
  };

  return (
    <Screen
      footer={
        <View style={styles.footerActions}>
          <Button
            disabled={!selectedSize}
            label={copy.checkout.addToCart}
            onPress={handleAddToCart}
            size="sm"
            style={styles.footerButton}
            variant="secondary"
          />
          <Button
            disabled={!selectedSize}
            label={copy.checkout.continue}
            onPress={() => router.push(`/customer/checkout/delivery?productId=${product.id}`)}
            size="sm"
            style={styles.footerButton}
          />
        </View>
      }
      footerMaxWidth={720}
      keyboardVerticalOffset={12}
      maxContentWidth={720}
      scroll
    >
      <CheckoutHeader
        currentStep={2}
        eyebrow={copy.checkout.purchaseFlow}
        onBackPress={() => router.back()}
        stepLabel={copy.checkout.step}
        subtitle={copy.checkout.sizeSubtitle}
        title={copy.checkout.sizeTitle}
      />

      <CheckoutProductSummary
        details={[
          product.collection ?? 'AVISHU',
          product.availability === 'preorder' ? copy.checkout.preorderPiece : copy.checkout.availableNow,
        ]}
        eyebrow={copy.checkout.selectedPiece}
        imageUrl={product.imageUrl}
        price={formatCurrency(product.price)}
        title={product.name}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.checkout.colorTone}</Text>
        <View style={styles.colorRow}>
          {meta.colors.map((color) => {
            const isSelected = (draft.colorId ?? meta.colors[0]?.id) === color.id;

            return (
              <Pressable
                key={color.id}
                onPress={() =>
                  updateDraft({
                    colorId: color.id,
                    colorLabel: color.label,
                  })
                }
                style={[styles.colorChip, isSelected ? styles.colorChipActive : null]}
              >
                <View style={[styles.swatch, { backgroundColor: color.swatch }]} />
                <Text style={[styles.colorLabel, isSelected ? styles.colorLabelActive : null]}>{color.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.checkout.size}</Text>
        <View style={styles.sizeGrid}>
          {meta.sizes.map((size) => {
            const isSelected = draft.size === size;

            return (
              <Pressable
                key={size}
                onPress={() => updateDraft({ size })}
                style={[styles.sizeChip, isSelected ? styles.sizeChipActive : null]}
              >
                <Text style={[styles.sizeLabel, isSelected ? styles.sizeLabelActive : null]}>{size}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>{copy.checkout.selectionNote}</Text>
        <Text style={styles.noteBody}>
          {product.availability === 'preorder'
            ? copy.checkout.selectionNotePreorder
            : copy.checkout.selectionNoteBody}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  colorChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  colorChipActive: {
    borderColor: theme.colors.border.strong,
  },
  colorLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  colorLabelActive: {
    color: theme.colors.text.primary,
  },
  colorRow: {
    gap: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  noteBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  notePanel: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  noteTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sizeChip: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    height: 52,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: theme.spacing.md,
  },
  sizeChipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sizeLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  sizeLabelActive: {
    color: theme.colors.text.inverse,
  },
  swatch: {
    borderColor: 'rgba(17,17,17,0.12)',
    borderWidth: theme.borders.width.thin,
    height: 18,
    width: 18,
  },
});
