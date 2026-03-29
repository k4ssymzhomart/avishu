import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { theme } from '@/lib/theme/tokens';

type SearchBarProps = {
  onChangeText: (text: string) => void;
  placeholder?: string;
  value: string;
};

function SearchIcon({ color = theme.colors.text.secondary }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClearIcon({ color = theme.colors.text.secondary }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchBar({ onChangeText, placeholder = 'Search products...', value }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <SearchIcon />
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
          <ClearIcon />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
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
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  input: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.size.md,
    height: '100%',
    padding: 0,
  },
});
