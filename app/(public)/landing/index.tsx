import { useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { Screen } from '@/components/layout/Screen';
import { OnboardingArtwork } from '@/components/public/OnboardingArtwork';
import { Button } from '@/components/ui/Button';
import { TextButton } from '@/components/ui/TextButton';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { theme } from '@/lib/theme/tokens';

type OnboardingPage = {
  description: string;
  eyebrow: string;
  key: string;
  title: string;
  variant: 'fashion' | 'tracking' | 'network';
};

const pages: OnboardingPage[] = [
  {
    key: 'fashion',
    eyebrow: 'Editorial entrance',
    title: 'AVISHU opens in a calmer register.',
    description: 'A more premium first impression with monochrome contrast, generous space, and a quieter fashion rhythm.',
    variant: 'fashion',
  },
  {
    key: 'tracking',
    eyebrow: 'Realtime order visibility',
    title: 'Tracking stays clear from order to readiness.',
    description: 'Customer, boutique, and production share one steady flow without noise, refreshes, or dashboard clutter.',
    variant: 'tracking',
  },
  {
    key: 'network',
    eyebrow: 'Connected roles',
    title: 'Every role enters the same AVISHU language.',
    description: 'Customer, franchisee, and production each get a focused shell while the product still feels singular and premium.',
    variant: 'network',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { authStatus, targetPath } = useRoleRedirect();
  const { height, width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingPage>>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageWidth = Math.max(width - theme.spacing.xl * 2, 280);
  const artworkHeight = Math.min(Math.max(height * 0.42, 312), 420);
  const isLastPage = pageIndex === pages.length - 1;

  if (authStatus !== 'guest') {
    return <Redirect href={targetPath} />;
  }

  const goToPage = (index: number) => {
    listRef.current?.scrollToIndex({ animated: true, index });
    setPageIndex(index);
  };

  const handleNext = () => {
    if (isLastPage) {
      router.push('/phone');
      return;
    }

    goToPage(pageIndex + 1);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(Math.max(0, Math.min(nextIndex, pages.length - 1)));
  };

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.carouselWrap}>
        <FlatList
          data={pages}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            index,
            length: pageWidth,
            offset: pageWidth * index,
          })}
          horizontal
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={handleMomentumEnd}
          pagingEnabled
          ref={listRef}
          renderItem={({ item, index }) => (
            <View style={[styles.page, { width: pageWidth }]}>
              <View style={styles.pageHeader}>
                <BrandWordmark size="sm" />
                <Text style={styles.pageCounter}>{`0${index + 1} / 03`}</Text>
              </View>

              <View style={styles.pageBody}>
                <OnboardingArtwork height={artworkHeight} variant={item.variant} />
                <View style={styles.copyBlock}>
                  <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              </View>
            </View>
          )}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((item, index) => {
            const isActive = pageIndex === index;

            return (
              <Pressable key={item.key} onPress={() => goToPage(index)} style={[styles.dot, isActive ? styles.dotActive : null]} />
            );
          })}
        </View>

        <View style={styles.actions}>
          {!isLastPage ? <TextButton label="Skip" onPress={() => router.push('/phone')} /> : <View style={styles.skipSpacer} />}
          <Button label={isLastPage ? 'Get started' : 'Next'} onPress={handleNext} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  carouselWrap: {
    flex: 1,
  },
  copyBlock: {
    gap: theme.spacing.sm,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 332,
  },
  dot: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    width: 28,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  footer: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  page: {
    flex: 1,
    gap: theme.spacing.xxl,
  },
  pageBody: {
    flex: 1,
    gap: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  pageCounter: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  pageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenContent: {
    flex: 1,
    paddingBottom: theme.spacing.xl,
  },
  skipSpacer: {
    width: 64,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
    maxWidth: 350,
  },
});
