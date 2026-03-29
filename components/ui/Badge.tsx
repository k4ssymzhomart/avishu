import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'inverse' | 'muted' | 'outline';
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const dotStyle =
    variant === 'inverse'
      ? styles.dotInverse
      : variant === 'muted'
        ? styles.dotMuted
        : styles.dotDefault;

  return (
    <View style={[styles.base, styles[variant]]}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={[styles.label, variant === 'inverse' ? styles.inverseLabel : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 12,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotDefault: {
    backgroundColor: theme.colors.text.primary,
  },
  dotInverse: {
    backgroundColor: theme.colors.text.inverseMuted,
  },
  dotMuted: {
    backgroundColor: theme.colors.text.secondary,
  },
  default: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
  },
  inverse: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  inverseLabel: {
    color: theme.colors.text.inverse,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  muted: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
  },
  outline: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.subtle,
  },
});
