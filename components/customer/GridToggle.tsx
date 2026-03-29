import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { theme } from '@/lib/theme/tokens';

export type GridMode = 'list' | 'grid';

type GridToggleProps = {
  mode: GridMode;
  onToggle: (mode: GridMode) => void;
};

function ListIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.text.primary : theme.colors.text.secondary;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={4} rx={1} fill={color} />
      <Rect x={3} y={10} width={18} height={4} rx={1} fill={color} />
      <Rect x={3} y={16} width={18} height={4} rx={1} fill={color} />
    </Svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.text.primary : theme.colors.text.secondary;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={13} y={3} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={3} y={13} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={13} y={13} width={8} height={8} rx={1.5} fill={color} />
    </Svg>
  );
}

export function GridToggle({ mode, onToggle }: GridToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onToggle('list')}
        style={[styles.button, mode === 'list' ? styles.buttonActive : null]}
        hitSlop={4}
      >
        <ListIcon active={mode === 'list'} />
      </Pressable>
      <Pressable
        onPress={() => onToggle('grid')}
        style={[styles.button, mode === 'grid' ? styles.buttonActive : null]}
        hitSlop={4}
      >
        <GridIcon active={mode === 'grid'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  buttonActive: {
    backgroundColor: theme.colors.surface.muted,
  },
  container: {
    borderColor: theme.colors.border.subtle,
    borderRadius: 10,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
});
