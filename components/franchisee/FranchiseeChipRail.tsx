import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type ChipItem = {
  count?: number;
  key: string;
  label: string;
};

type FranchiseeChipRailProps = {
  items: ChipItem[];
  onSelect: (key: string) => void;
  selectedKey: string;
};

export function FranchiseeChipRail({ items, onSelect, selectedKey }: FranchiseeChipRailProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.rail}>
        {items.map((item) => {
          const isActive = item.key === selectedKey;

          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.chip,
                isActive ? styles.chipActive : null,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text style={[styles.label, isActive ? styles.labelActive : null]}>{item.label}</Text>
              {typeof item.count === 'number' ? (
                <Text style={[styles.count, isActive ? styles.countActive : null]}>{item.count.toString().padStart(2, '0')}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  chipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  chipPressed: {
    opacity: 0.84,
  },
  count: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  countActive: {
    color: theme.colors.text.inverseMuted,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: theme.colors.text.inverse,
  },
  rail: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
  },
});
