import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteToggleButton } from '@/components/product/FavoriteToggleButton';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import type { Product } from '@/types/product';

type ProductGridCardProps = {
  isFavorite?: boolean;
  onPress?: () => void;
  product: Product;
};

export function ProductGridCard({ isFavorite = false, onPress, product }: ProductGridCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.imageFrame}>
        {product.imageUrl ? (
          <Image resizeMode="cover" source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>AVISHU</Text>
        )}
        {product.availability === 'preorder' ? (
          <View style={styles.preorderBadge}>
            <Text style={styles.preorderText}>PRE-ORDER</Text>
          </View>
        ) : null}
        {isFavorite ? (
          <View style={styles.favoriteBadge}>
            <FavoriteToggleButton isActive />
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.collection}>
            {product.collection ?? 'AVISHU'}
          </Text>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.category}>
          {product.category ?? 'Curated selection'}
        </Text>
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  category: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  collection: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  favoriteBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageFrame: {
    aspectRatio: 3 / 4,
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.hairline,
    overflow: 'hidden',
  },
  info: {
    gap: theme.spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  name: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 18,
    lineHeight: 24,
  },
  placeholderText: {
    alignSelf: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    marginTop: '45%',
    textTransform: 'uppercase',
  },
  preorderBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    top: 8,
  },
  preorderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
  },
  pressed: {
    opacity: 0.8,
  },
  pressable: {},
  price: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
});
