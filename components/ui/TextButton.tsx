import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type TextButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function TextButton({ label, style, ...props }: TextButtonProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.base, pressed ? styles.pressed : null, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'flex-start',
  },
  label: {
    borderBottomColor: theme.colors.border.strong,
    borderBottomWidth: theme.borders.width.hairline,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    paddingBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.65,
  },
});
