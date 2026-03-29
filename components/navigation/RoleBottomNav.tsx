import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { NavIcon } from '@/components/navigation/NavIcon';
import type { BottomNavItem } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';

type RoleBottomNavProps = {
  activeKey: string;
  items: BottomNavItem[];
  variant?: 'default' | 'floating';
};

export function RoleBottomNav({ activeKey, items, variant = 'default' }: RoleBottomNavProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isFloating = variant === 'floating';
  const isWide = width >= 960;

  return (
    <View style={[styles.container, isFloating ? styles.containerFloating : null]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href as never)}
            style={({ pressed }) => [
              styles.item,
              isFloating ? styles.itemFloating : null,
              isWide && isFloating ? styles.itemFloatingWide : null,
              isActive ? styles.itemActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.itemStack}>
              <NavIcon active={isActive} name={item.key} />
              <Text style={[styles.label, isActive ? styles.labelActive : null]}>{item.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 24,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  containerFloating: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    padding: 0,
  },
  item: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: theme.borders.width.thin,
    borderColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  itemActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  itemFloating: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 22,
    flex: 0,
    minHeight: 68,
    minWidth: 76,
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  itemFloatingWide: {
    minWidth: 88,
    paddingHorizontal: theme.spacing.lg,
  },
  itemStack: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weight.semibold,
  },
  pressed: {
    opacity: 0.84,
  },
});
