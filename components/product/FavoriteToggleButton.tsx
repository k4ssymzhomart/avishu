import { Pressable, StyleSheet } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { theme } from '@/lib/theme/tokens';

type FavoriteToggleButtonProps = {
  isActive: boolean;
  onPress?: () => void;
};

export function FavoriteToggleButton({ isActive, onPress }: FavoriteToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isActive ? styles.buttonActive : null,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <AssetIcon
        color={theme.colors.text.primary}
        fill={isActive ? theme.colors.text.primary : 'none'}
        name="heart"
        size={16}
        strokeWidth={1.8}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderColor: 'rgba(17,17,17,0.08)',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
