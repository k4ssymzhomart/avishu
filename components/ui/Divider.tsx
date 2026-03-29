import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type DividerProps = {
  style?: StyleProp<ViewStyle>;
  strong?: boolean;
};

export function Divider({ style, strong = false }: DividerProps) {
  return <View style={[styles.base, strong ? styles.strong : null, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.border.subtle,
    height: theme.borders.width.hairline,
    width: '100%',
  },
  strong: {
    backgroundColor: theme.colors.border.strong,
  },
});
