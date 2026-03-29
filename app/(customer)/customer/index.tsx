import { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryRail } from '@/components/customer/CategoryRail';
import { GridToggle, type GridMode } from '@/components/customer/GridToggle';
import { SearchBar } from '@/components/customer/SearchBar';
import { AssetIcon } from '@/components/icons/AssetIcon';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { ProductGridCard } from '@/components/product/ProductGridCard';
import { ProductPreviewCard } from '@/components/product/ProductPreviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useCustomerChatThreads } from '@/hooks/useChat';
import { useProducts } from '@/hooks/useProducts';
import { customerBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import { formatAvailability, formatCurrency } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';
import { useSessionStore } from '@/store/session';

const categories = ['ALL', 'NEW', 'OUTERWEAR', 'BASICS', 'CARDIGANS / KNIT', 'TROUSERS', 'SKIRTS'] as const;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const waveIcon = require('@/images/waving-hand.png');

type HomeLayout = {
  contentWidth: number;
  gridGap: number;
  isDesktop: boolean;
  isTablet: boolean;
  listColumns: number;
  maxContentWidth: number | undefined;
  productColumns: number;
};

function getHomeLayout(width: number): HomeLayout {
  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const maxContentWidth = width >= 1360 ? 1320 : width >= 1100 ? 1180 : width >= 768 ? 940 : undefined;
  const contentWidth = Math.min(width - theme.spacing.xl * 2, maxContentWidth ?? width - theme.spacing.xl * 2);

  return {
    contentWidth,
    gridGap: isDesktop ? theme.spacing.lg : theme.spacing.md,
    isDesktop,
    isTablet,
    listColumns: isDesktop ? 2 : 1,
    maxContentWidth,
    productColumns: isDesktop ? 4 : width >= 860 ? 3 : 2,
  };
}

function HomeSkeletonLoader({ layout }: { layout: HomeLayout }) {
  const gridItemWidth =
    (layout.contentWidth - layout.gridGap * (layout.productColumns - 1)) / layout.productColumns;

  return (
    <View style={skeletonStyles.page}>
      <View style={[skeletonStyles.topDeck, layout.isTablet ? skeletonStyles.topDeckWide : null]}>
        <View style={skeletonStyles.ledeColumn}>
          <View style={skeletonStyles.headerRow}>
            <View style={skeletonStyles.headerCopy}>
              <SkeletonBlock height={24} width="54%" />
              <SkeletonBlock height={12} width="24%" />
            </View>
            <View style={skeletonStyles.headerActions}>
              <SkeletonBlock borderRadius={20} height={42} width={42} />
              <SkeletonBlock borderRadius={21} height={42} width={42} />
            </View>
          </View>

          <SkeletonBlock borderRadius={16} height={52} />

          <View style={skeletonStyles.categoryRow}>
            {[112, 94, 126, 92, 74].map((chipWidth) => (
              <SkeletonBlock key={chipWidth} borderRadius={18} height={36} width={chipWidth} />
            ))}
          </View>

          <View style={skeletonStyles.controlRow}>
            <SkeletonBlock height={13} width={110} />
            <SkeletonBlock borderRadius={12} height={40} width={82} />
          </View>
        </View>

        <SkeletonBlock borderRadius={28} height={layout.isDesktop ? 450 : layout.isTablet ? 360 : 300} />
      </View>

      <View style={[skeletonStyles.grid, { gap: layout.gridGap }]}>
        {Array.from({ length: layout.productColumns * 2 }).map((_, index) => (
          <View key={index} style={{ width: gridItemWidth }}>
            <SkeletonBlock borderRadius={18} height={gridItemWidth * 1.34} />
            <View style={skeletonStyles.productMeta}>
              <SkeletonBlock height={11} width="58%" />
              <SkeletonBlock height={19} width="84%" />
              <SkeletonBlock height={11} width="44%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  controlCopy: {
    gap: theme.spacing.xs,
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
    marginRight: theme.spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ledeColumn: {
    flex: 1,
    gap: theme.spacing.xl,
  },
  page: {
    gap: theme.spacing.xxxl,
  },
  productMeta: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  topDeck: {
    gap: theme.spacing.xl,
  },
  topDeckWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
});

export default function CustomerHomeScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const { products, isLoading } = useProducts();
  const { threads } = useCustomerChatThreads(currentUserId);
  const cartItemCount = useCartStore((state) => state.cartItems.length);
  const favoriteProductIds = useFavoritesStore((state) => state.favoriteProductIds);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridMode, setGridMode] = useState<GridMode>('grid');
  const { width } = useWindowDimensions();

  const layout = useMemo(() => getHomeLayout(width), [width]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'ALL') {
      const matchingProducts = result.filter((product) => product.category === selectedCategory);
      if (matchingProducts.length > 0) {
        result = matchingProducts;
      }
    }

    if (searchQuery.trim().length > 0) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          (product.collection && product.collection.toLowerCase().includes(normalizedQuery)) ||
          (product.category && product.category.toLowerCase().includes(normalizedQuery)),
      );
    }

    return result;
  }, [products, searchQuery, selectedCategory]);

  const firstName = currentUserName ? currentUserName.split(' ')[0] : null;
  const heroProduct = products.find((product) => product.collection === 'ALL.INN') ?? products[0];
  const unreadNotificationCount = threads.reduce(
    (count, thread) => count + thread.unreadCountForCustomer,
    0,
  );
  const gridItemWidth =
    (layout.contentWidth - layout.gridGap * (layout.productColumns - 1)) / layout.productColumns;
  const listItemWidth =
    layout.listColumns > 1
      ? (layout.contentWidth - layout.gridGap * (layout.listColumns - 1)) / layout.listColumns
      : layout.contentWidth;

  if (isLoading) {
    return (
      <Screen
        footer={<RoleBottomNav activeKey="home" items={customerBottomNav} variant="floating" />}
        footerMaxWidth={540}
        footerMode="floating"
        maxContentWidth={layout.maxContentWidth}
        scroll
      >
        <HomeSkeletonLoader layout={layout} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={<RoleBottomNav activeKey="home" items={customerBottomNav} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <View style={[styles.topDeck, layout.isTablet ? styles.topDeckWide : null]}>
        <View style={styles.ledeColumn}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <View style={styles.greetingRow}>
                <Text numberOfLines={1} style={styles.greeting}>
                  {firstName ? `Hello, ${firstName}` : 'Welcome'}
                </Text>
                <Image resizeMode="contain" source={waveIcon} style={styles.waveIcon} />
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/customer/notifications')}
                style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : null]}
              >
                <AssetIcon color={theme.colors.text.primary} name="alarm" size={18} />
                {unreadNotificationCount ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => router.push('/customer/cart')}
                style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : null]}
              >
                <AssetIcon color={theme.colors.text.primary} name="packed" size={18} />
                {cartItemCount ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => router.push('/customer/profile')}
                style={({ pressed }) => [styles.avatarWrap, pressed ? styles.iconButtonPressed : null]}
              >
                <Text style={styles.avatarText}>
                  {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A'}
                </Text>
              </Pressable>
            </View>
          </View>

          <SearchBar
            onChangeText={setSearchQuery}
            placeholder="Search collections..."
            value={searchQuery}
          />

          <CategoryRail
            categories={[...categories]}
            onSelect={setSelectedCategory}
            selectedCategory={selectedCategory}
            wrap={layout.isDesktop}
          />

          <View style={styles.controlRow}>
            <Text style={styles.controlMeta}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </Text>
            <GridToggle mode={gridMode} onToggle={setGridMode} />
          </View>

          <View style={styles.metricRow}>
            <Pressable onPress={() => router.push('/customer/cart')} style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cart</Text>
              <Text style={styles.metricValue}>{cartItemCount ? `${cartItemCount} selected` : 'Ready to fill'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/customer/chat')} style={styles.metricCard}>
              <Text style={styles.metricLabel}>Support</Text>
              <Text style={styles.metricValue}>
                {unreadNotificationCount ? `${unreadNotificationCount} unread updates` : 'Order threads stay calm'}
              </Text>
            </Pressable>
          </View>
        </View>

        {!searchQuery && heroProduct ? (
          <Pressable
            onPress={() => router.push(`/customer/product/${heroProduct.id}`)}
            style={({ pressed }) => [
              styles.heroBanner,
              layout.isTablet ? styles.heroBannerWide : null,
              pressed ? styles.heroPressed : null,
            ]}
          >
            {heroProduct.imageUrl ? (
              <Image resizeMode="cover" source={{ uri: heroProduct.imageUrl }} style={styles.heroImage} />
            ) : null}

            <View style={styles.heroOverlay}>
              <Text style={styles.heroCollection}>{heroProduct.collection ?? 'AVISHU'}</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroTitle}>{heroProduct.name}</Text>
                  <Text style={styles.heroMeta}>
                    {`${formatAvailability(heroProduct.availability)} / ${heroProduct.category ?? 'Curated piece'}`}
                  </Text>
                </View>
                <Text style={styles.heroPrice}>{formatCurrency(heroProduct.price)}</Text>
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>

      {filteredProducts.length === 0 ? (
        <EmptyState
          description="Try a different search or switch categories to reopen the curated selection."
          title="No products found"
        />
      ) : gridMode === 'grid' ? (
        <View style={[styles.grid, { gap: layout.gridGap }]}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={{ width: gridItemWidth }}>
              <ProductGridCard
                isFavorite={favoriteProductIds.includes(product.id)}
                onPress={() => router.push(`/customer/product/${product.id}`)}
                product={product}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.listGrid, { gap: layout.gridGap }]}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={{ width: listItemWidth }}>
              <ProductPreviewCard
                isFavorite={favoriteProductIds.includes(product.id)}
                onPress={() => router.push(`/customer/product/${product.id}`)}
                product={product}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  greeting: {
    color: theme.colors.text.primary,
    flexShrink: 1,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  heroBanner: {
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 28,
    minHeight: 320,
    overflow: 'hidden',
  },
  heroBannerWide: {
    flex: 1.08,
    minHeight: 420,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  heroBadgeLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCollection: {
    color: '#FFFFFF',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
    marginRight: theme.spacing.md,
  },
  heroFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  heroOverlay: {
    backgroundColor: 'rgba(17,17,17,0.14)',
    gap: theme.spacing.md,
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  heroPressed: {
    opacity: 0.92,
  },
  heroPrice: {
    color: '#FFFFFF',
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: theme.typography.family.display,
    fontSize: 28,
    lineHeight: 32,
    maxWidth: 260,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 21,
    borderWidth: theme.borders.width.thin,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  iconButtonPressed: {
    opacity: 0.84,
  },
  ledeColumn: {
    flex: 1,
    gap: theme.spacing.xl,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: 4,
    minHeight: 76,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  notificationBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: 9,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
  },
  topDeck: {
    gap: theme.spacing.xxl,
  },
  topDeckWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  waveIcon: {
    height: 42,
    width: 42,
  },
});
