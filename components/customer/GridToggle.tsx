import { Pressable, StyleSheet, View } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { theme } from '@/lib/theme/tokens';

export type GridMode = 'list' | 'grid';

type GridToggleProps = {
  mode: GridMode;
  onToggle: (mode: GridMode) => void;
};

function ListIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.text.primary : theme.colors.text.secondary;
  return <AssetIcon color={color} name="list" size={15} />;
}

function GridIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.text.primary : theme.colors.text.secondary;
  return <AssetIcon color={color} name="grid" size={15} />;
}

export function GridToggle({ mode, onToggle }: GridToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onToggle('list')}
        style={({ pressed }) => [styles.button, mode === 'list' ? styles.buttonActive : null, pressed ? styles.buttonPressed : null]}
        hitSlop={4}
      >
        <ListIcon active={mode === 'list'} />
      </Pressable>
      <Pressable
        onPress={() => onToggle('grid')}
        style={({ pressed }) => [styles.button, mode === 'grid' ? styles.buttonActive : null, pressed ? styles.buttonPressed : null]}
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
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  buttonActive: {
    backgroundColor: theme.colors.surface.muted,
  },
  buttonPressed: {
    opacity: 0.84,
  },
  container: {
    borderColor: theme.colors.border.subtle,
    borderRadius: 12,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: 4,
    padding: 3,
  },
});
