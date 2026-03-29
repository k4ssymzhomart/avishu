import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'sm' ? styles.small : null,
        pressed ? styles.pressed : null,
        props.disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'sm' ? styles.smallLabel : null, variant === 'primary' ? styles.primaryLabel : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.45,
  },
  ghost: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.subtle,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
  primary: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  primaryLabel: {
    color: theme.colors.text.inverse,
  },
  secondary: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
  },
  small: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  smallLabel: {
    fontSize: theme.typography.size.xs,
    letterSpacing: theme.typography.tracking.wide,
  },
});
