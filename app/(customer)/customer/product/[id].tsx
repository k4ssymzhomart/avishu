import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { Screen } from '@/components/layout/Screen';
import { FavoriteToggleButton } from '@/components/product/FavoriteToggleButton';
import { Button } from '@/components/ui/Button';
import { useProduct } from '@/hooks/useProduct';
import { theme } from '@/lib/theme/tokens';
import { formatAvailability, formatCurrency } from '@/lib/utils/format';
import { getProductCatalogMeta } from '@/lib/utils/productCatalog';
import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoading, product } = useProduct(id ?? null);
  const { beginDirectCheckout, cartItems } = useCartStore();
  const favoriteProductIds = useFavoritesStore((state) => state.favoriteProductIds);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const maxContentWidth = width >= 1320 ? 1160 : width >= 980 ? 980 : undefined;
  const isFavorite = !!product && favoriteProductIds.includes(product.id);

  if (isLoading) {
    return (
      <Screen maxContentWidth={maxContentWidth} scroll>
        <Text style={styles.loadingText}>Loading product</Text>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen maxContentWidth={maxContentWidth} scroll>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Not found</Text>
          <Text style={styles.emptyBody}>This product is no longer available.</Text>
          <Button label="Return home" onPress={() => router.replace('/customer')} size="sm" />
        </View>
      </Screen>
    );
  }

  const meta = getProductCatalogMeta(product);

  return (
    <Screen
      footer={
        <View style={styles.footerActions}>
          <Button
            label={cartItems.length ? `View cart (${cartItems.length})` : 'View cart'}
            onPress={() => router.push('/customer/cart')}
            size="sm"
            style={styles.footerButton}
            variant="secondary"
          />
          <Button
            label="Select size"
            onPress={() => {
              beginDirectCheckout(product);
              router.push(`/customer/checkout/size?productId=${product.id}`);
            }}
            size="sm"
            style={styles.footerButton}
          />
        </View>
      }
      footerMaxWidth={640}
      maxContentWidth={maxContentWidth}
      scroll
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topButton}>
          <AssetIcon color={theme.colors.text.primary} name="backArrow" size={16} />
        </Pressable>
        <Text style={styles.pageTitle}>Details</Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push('/customer/cart')} style={styles.topButton}>
            <AssetIcon color={theme.colors.text.primary} name="packed" size={16} />
            {cartItems.length ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeLabel}>{cartItems.length > 9 ? '9+' : cartItems.length}</Text>
              </View>
            ) : null}
          </Pressable>
          <FavoriteToggleButton
            isActive={isFavorite}
            onPress={() => {
              if (product) {
                toggleFavorite(product.id);
              }
            }}
          />
        </View>
      </View>

      <View style={[styles.heroSection, isWide ? styles.heroSectionWide : null]}>
        <View style={[styles.imagePanel, isWide ? styles.imagePanelWide : null]}>
          {product.imageUrl ? (
            <Image resizeMode="cover" source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>AVISHU</Text>
            </View>
          )}
        </View>

        <View style={[styles.detailPanel, isWide ? styles.detailPanelWide : null]}>
          <View style={styles.metaHeader}>
            <Text style={styles.collection}>{product.collection ?? 'AVISHU'}</Text>
            <Text style={styles.availability}>{formatAvailability(product.availability)}</Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          </View>

          <Text style={styles.description}>{meta.description}</Text>

          <View style={styles.selectorRow}>
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>Tone</Text>
              <View style={styles.swatchRow}>
                {meta.colors.slice(0, 3).map((color) => (
                  <View key={color.id} style={[styles.swatch, { backgroundColor: color.swatch }]} />
                ))}
                <Text style={styles.selectorValue}>{meta.colors.map((color) => color.label).join(' / ')}</Text>
              </View>
            </View>

            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>Sizes</Text>
              <Text style={styles.selectorValue}>{meta.sizes.join('  ')}</Text>
            </View>
          </View>

          <View style={styles.factGrid}>
            <View style={styles.factCard}>
              <Text style={styles.factLabel}>About</Text>
              <Text style={styles.factValue}>{product.category ?? 'Curated piece'}</Text>
            </View>
            <View style={styles.factCard}>
              <Text style={styles.factLabel}>Material</Text>
              <Text style={styles.factValue}>{meta.material}</Text>
            </View>
            <View style={styles.factCard}>
              <Text style={styles.factLabel}>Fit</Text>
              <Text style={styles.factValue}>{meta.fit}</Text>
            </View>
          </View>

          <View style={styles.noteStrip}>
            <Text style={styles.noteLabel}>Purchase flow</Text>
            <Text style={styles.noteText}>
              Product details, size, delivery, payment, and confirmation are now separated into cleaner steps.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  availability: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  cartBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  cartBadgeLabel: {
    color: theme.colors.text.inverse,
    fontSize: 9,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
  },
  collection: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: 22,
    maxWidth: 520,
  },
  detailPanel: {
    gap: theme.spacing.lg,
  },
  detailPanelWide: {
    flex: 0.95,
    justifyContent: 'center',
  },
  emptyBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    justifyContent: 'center',
    minHeight: 440,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  factCard: {
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: 6,
    minWidth: 150,
    padding: theme.spacing.md,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  factLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  factValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  heroSection: {
    gap: theme.spacing.xl,
  },
  heroSectionWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imagePanel: {
    aspectRatio: 4 / 5,
    backgroundColor: theme.colors.surface.muted,
    overflow: 'hidden',
  },
  imagePanelWide: {
    flex: 1.05,
  },
  imagePlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  metaHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  noteStrip: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  noteText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  pageTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  price: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
    marginLeft: theme.spacing.lg,
  },
  selectorCard: {
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.sm,
    minWidth: 160,
    padding: theme.spacing.md,
  },
  selectorLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  selectorValue: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  swatch: {
    borderColor: 'rgba(17,17,17,0.12)',
    borderWidth: theme.borders.width.thin,
    height: 16,
    width: 16,
  },
  swatchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.family.display,
    fontSize: 36,
    lineHeight: 42,
    maxWidth: 420,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
});
