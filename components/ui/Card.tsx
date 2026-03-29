import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type CardProps = {
  children: ReactNode;
  variant?: 'default' | 'muted' | 'inverse';
  padding?: 'none' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'default', padding = 'md', style }: CardProps) {
  return <View style={[styles.base, styles[variant], padding === 'lg' ? styles.paddingLg : padding === 'md' ? styles.paddingMd : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
  },
  default: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
  },
  inverse: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  muted: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
  },
  paddingLg: {
    padding: theme.spacing.xl,
  },
  paddingMd: {
    padding: theme.spacing.lg,
  },
});
