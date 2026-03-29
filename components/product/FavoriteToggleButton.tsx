import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
      <Svg fill={isActive ? '#111111' : 'none'} height={18} viewBox="0 0 24 24" width={18}>
        <Path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke="#111111"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderColor: 'rgba(17,17,17,0.08)',
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
