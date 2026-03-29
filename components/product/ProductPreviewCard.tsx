import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FavoriteToggleButton } from '@/components/product/FavoriteToggleButton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { theme } from '@/lib/theme/tokens';
import { formatAvailability, formatCurrency } from '@/lib/utils/format';
import type { Product } from '@/types/product';

type ProductPreviewCardProps = {
  isFavorite?: boolean;
  language?: 'en' | 'ru';
  onPress?: () => void;
  product: Product;
};

export function ProductPreviewCard({ isFavorite = false, language = 'en', onPress, product }: ProductPreviewCardProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const content = (
    <Card padding="lg" style={[styles.card, isWide ? styles.cardWide : null]}>
      <View style={[styles.content, isWide ? styles.contentWide : null]}>
        <View style={[styles.imageFrame, isWide ? styles.imageFrameWide : null]}>
          {product.imageUrl ? (
            <Image resizeMode="cover" source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <Text style={styles.placeholderText}>AVISHU</Text>
          )}
        </View>

        <View style={styles.copyBlock}>
          <View style={styles.topLine}>
            <Text style={styles.category}>{product.category ?? (language === 'ru' ? 'Каталог' : 'Catalog')}</Text>
            {isFavorite ? <FavoriteToggleButton isActive /> : null}
            <Badge
              label={formatAvailability(product.availability, language)}
              variant={product.availability === 'preorder' ? 'muted' : 'outline'}
            />
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.collection}>
            {product.collection ? `${product.collection} / AVISHU` : language === 'ru' ? 'AVISHU / Женская линия' : 'AVISHU / Women'}
          </Text>

          <Divider />

          <View style={styles.footer}>
            <Text style={styles.meta}>
              {product.preorderLeadDays
                ? language === 'ru'
                  ? `Срок ${product.preorderLeadDays} дн.`
                  : `Lead time ${product.preorderLeadDays} days`
                : language === 'ru'
                  ? 'Доступно к оформлению сейчас'
                  : 'Available to place now'}
            </Text>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          </View>
        </View>
      </View>
    </Card>
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
    gap: theme.spacing.lg,
  },
  cardWide: {
    minHeight: 320,
  },
  category: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  collection: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  content: {
    gap: theme.spacing.lg,
  },
  contentWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  copyBlock: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  footer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.hairline,
    height: 280,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageFrameWide: {
    aspectRatio: 3 / 4,
    flexShrink: 0,
    width: 260,
  },
  meta: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  name: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  placeholderText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.82,
  },
  pressable: {
    borderRadius: theme.borders.radius.none,
  },
  price: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});
