import type { ImageSourcePropType } from 'react-native';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/lib/theme/tokens';

type OnboardingArtworkProps = {
  height: number;
  variant: 'fashion' | 'tracking' | 'network';
};

const artworkConfig: Record<
  OnboardingArtworkProps['variant'],
  {
    caption: string;
    kicker: string;
    source: ImageSourcePropType;
    translateX: number;
    translateY: number;
    scale: number;
  }
> = {
  fashion: {
    caption: 'A quieter luxury entrance',
    kicker: 'Editorial frame',
    scale: 1.08,
    source: require('../../images/1st-mono.png'),
    translateX: 0,
    translateY: -8,
  },
  network: {
    caption: 'Three roles, one product language',
    kicker: 'Connected shell',
    scale: 1.14,
    source: require('../../images/3rd-mono.png'),
    translateX: 8,
    translateY: 10,
  },
  tracking: {
    caption: 'Realtime visibility with calm contrast',
    kicker: 'Tracked flow',
    scale: 1.16,
    source: require('../../images/2nd-mono.png'),
    translateX: 10,
    translateY: 0,
  },
};

export function OnboardingArtwork({ variant, height }: OnboardingArtworkProps) {
  const artwork = artworkConfig[variant];

  return (
    <View style={[styles.frame, { height }]}>
      <ImageBackground
        imageStyle={[
          styles.imageAsset,
          {
            transform: [{ scale: artwork.scale }, { translateX: artwork.translateX }, { translateY: artwork.translateY }],
          },
        ]}
        resizeMode="cover"
        source={artwork.source}
        style={styles.imageShell}
      >
        <LinearGradient colors={['rgba(2,2,2,0.08)', 'rgba(10,10,10,0.48)', 'rgba(4,4,4,0.92)']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']} style={styles.edgeGlow} />
        <View pointerEvents="none" style={styles.innerFrame} />

        <View style={styles.topMeta}>
          <Text style={styles.kicker}>{artwork.kicker}</Text>
          <View style={styles.metaLine} />
        </View>

        <View style={styles.bottomMeta}>
          <Text style={styles.caption}>{artwork.caption}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomMeta: {
    bottom: theme.spacing.xl,
    left: theme.spacing.xl,
    position: 'absolute',
    right: theme.spacing.xl,
  },
  caption: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 280,
  },
  edgeGlow: {
    borderRadius: 28,
    inset: 0,
    position: 'absolute',
  },
  frame: {
    backgroundColor: '#050505',
    borderColor: theme.colors.border.subtle,
    borderRadius: 28,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
    position: 'relative',
  },
  imageAsset: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  imageShell: {
    flex: 1,
    justifyContent: 'space-between',
  },
  innerFrame: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: theme.borders.width.thin,
    inset: 16,
    position: 'absolute',
  },
  kicker: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaLine: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    flex: 1,
    height: 1,
  },
  topMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
});
