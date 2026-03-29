import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { theme } from '@/lib/theme/tokens';

type SearchBarProps = {
  onChangeText: (text: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchBar({ onChangeText, placeholder = 'Search products...', value }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <AssetIcon color={theme.colors.text.secondary} name="search" size={15} />
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.secondary}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} style={styles.clearButton} hitSlop={8}>
          <AssetIcon color={theme.colors.text.secondary} name="x" size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  input: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.size.md,
    height: '100%',
    padding: 0,
  },
});
