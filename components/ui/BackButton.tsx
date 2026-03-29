import type { PressableProps } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { theme } from '@/lib/theme/tokens';

type BackButtonProps = Omit<PressableProps, 'style'>;

export function BackButton(props: BackButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      {...props}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null, props.disabled ? styles.disabled : null]}
    >
      <AssetIcon color={theme.colors.text.primary} name="backArrow" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
