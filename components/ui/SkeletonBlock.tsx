import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type SkeletonBlockProps = {
  borderRadius?: number;
  height: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
  width?: number | `${number}%` | 'auto';
};

export function SkeletonBlock({
  borderRadius = theme.borders.radius.sm,
  height,
  style,
  width = '100%',
}: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { duration: 900, toValue: 1, useNativeDriver: true }),
        Animated.timing(shimmer, { duration: 900, toValue: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <Animated.View
      style={[
        styles.base,
        { borderRadius, height, opacity, width },
        style,
      ]}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: `${number}%`;
};

export function SkeletonText({ gap = 8, lastLineWidth = '60%', lineHeight = 14, lines = 2 }: SkeletonTextProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.border.subtle,
  },
});
