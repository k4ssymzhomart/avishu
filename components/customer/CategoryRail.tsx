import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type CategoryRailProps = {
  categories: Array<{
    key: string;
    label: string;
  }>;
  selectedCategory: string;
  onSelect: (category: string) => void;
  wrap?: boolean;
};

export function CategoryRail({ categories, selectedCategory, onSelect, wrap = false }: CategoryRailProps) {
  const content = categories.map((category) => {
    const isActive = category.key === selectedCategory;

    return (
      <Pressable
        key={category.key}
        onPress={() => onSelect(category.key)}
        style={({ pressed }) => [
          styles.chip,
          isActive ? styles.chipActive : null,
          pressed ? styles.chipPressed : null,
        ]}
      >
        <Text style={[styles.label, isActive ? styles.labelActive : null]}>{category.label}</Text>
      </Pressable>
    );
  });

  if (wrap) {
    return <View style={[styles.row, styles.rowWrap]}>{content}</View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  chipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  chipPressed: {
    opacity: 0.82,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: theme.colors.text.inverse,
  },
  row: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rowWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
